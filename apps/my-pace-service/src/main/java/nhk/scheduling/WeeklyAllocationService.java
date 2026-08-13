package nhk.scheduling;

import lombok.RequiredArgsConstructor;
import nhk.calendar.FixedEventResponse;
import nhk.calendar.FixedEventService;
import nhk.category.Category;
import nhk.category.CategoryRepository;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.timeblock.TaskTimeBlock;
import nhk.timeblock.TaskTimeBlockRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WeeklyAllocationService {

    private final UserRepository userRepository;
    private final TaskTimeBlockRepository timeBlockRepository;
    private final FixedEventService fixedEventService;
    private final TaskRepository taskRepository;
    private final CategoryRepository categoryRepository;

    public WeeklyAllocationSummary getWeeklyAllocation(UUID userId, Integer bufferMinutesInput) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        ZoneId zoneId = ZoneId.of(user.getTimezone() != null && !user.getTimezone().isBlank() ? user.getTimezone() : "UTC");
        
        // Xác định từ Thứ 2 đến Chủ nhật của TUẦN HIỆN TẠI (This Week)
        LocalDate today = LocalDate.now(zoneId);
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        LocalTime wakeTime = user.getWakeTime() != null ? user.getWakeTime() : LocalTime.of(7, 0);
        LocalTime sleepTime = user.getSleepTime() != null ? user.getSleepTime() : LocalTime.of(23, 0);
        int wakeMin = wakeTime.getHour() * 60 + wakeTime.getMinute();
        int sleepMin = sleepTime.getHour() * 60 + sleepTime.getMinute();
        int bufferPct = user.getBufferPct() != null ? user.getBufferPct() : 20;

        // Lấy tất cả Timeblocks trong tuần (kể cả quá khứ và tương lai)
        List<TaskTimeBlock> blocks = timeBlockRepository.findByUserIdAndDateRange(
                userId,
                startOfWeek.atStartOfDay(),
                endOfWeek.atTime(LocalTime.MAX)
        );

        // Lấy tất cả FixedEvents trong tuần
        List<FixedEventResponse> events = fixedEventService.getEventsInRange(userId, startOfWeek, endOfWeek);

        // Lấy thông tin Category map
        Map<UUID, Category> categoryMap = categoryRepository.findByUserIdWithTimeContext(userId)
                .stream().collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a));

        // Lấy thông tin Task map (kể cả task Done, để ánh xạ categoryId)
        Map<UUID, Task> taskMap = taskRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(Task::getId, t -> t, (a, b) -> a));

        Map<UUID, Integer> minutesByCategory = new HashMap<>();
        int uncategorizedMinutes = 0;
        int totalScheduledMinutes = 0;

        // Xử lý Timeblocks
        for (TaskTimeBlock block : blocks) {
            int duration = (int) java.time.Duration.between(block.getStartTime(), block.getEndTime()).toMinutes();
            if (duration < 0) duration += 1440;

            totalScheduledMinutes += duration;
            Task task = taskMap.get(block.getTaskId());
            if (task != null && task.getCategoryId() != null) {
                minutesByCategory.merge(task.getCategoryId(), duration, Integer::sum);
            } else {
                uncategorizedMinutes += duration;
            }
        }

        // Xử lý Fixed Events
        for (FixedEventResponse ev : events) {
            if ("BUSY".equalsIgnoreCase(ev.availabilityStatus())) {
                int duration = 0;
                if (Boolean.TRUE.equals(ev.isAllDay())) {
                    duration = 1440;
                } else if (ev.startTime() != null && ev.endTime() != null) {
                    duration = (int) java.time.Duration.between(ev.startTime(), ev.endTime()).toMinutes();
                    if (duration < 0) duration += 1440;
                }

                if (duration > 0) {
                    totalScheduledMinutes += duration;
                    if (ev.categoryId() != null) {
                        minutesByCategory.merge(ev.categoryId(), duration, Integer::sum);
                    } else {
                        uncategorizedMinutes += duration;
                    }
                }
            }
        }

        // Gom nhóm Categories
        List<CategoryAllocation> allocations = new ArrayList<>();
        for (Map.Entry<UUID, Integer> entry : minutesByCategory.entrySet()) {
            Category cat = categoryMap.get(entry.getKey());
            if (cat != null) {
                allocations.add(new CategoryAllocation(
                        cat.getId(),
                        cat.getName(),
                        cat.getColor(),
                        entry.getValue()
                ));
            } else {
                uncategorizedMinutes += entry.getValue();
            }
        }

        if (uncategorizedMinutes > 0) {
            allocations.add(new CategoryAllocation(
                    null,
                    "Khác",
                    "#94a3b8",
                    uncategorizedMinutes
            ));
        }

        allocations.sort((a, b) -> Integer.compare(b.scheduledMinutes(), a.scheduledMinutes()));

        // Tính toán buffer và free time (đúng 7 ngày)
        int days = 7;
        int awakeMinutesPerDay = sleepMin < wakeMin ? (sleepMin + 1440 - wakeMin) : (sleepMin - wakeMin);
        int totalAvailableMinutes = awakeMinutesPerDay * days;

        int bufferMinutes = (int) ((totalAvailableMinutes - totalScheduledMinutes) * (bufferPct / 100.0));
        if (bufferMinutes < 0) bufferMinutes = 0;

        int freeMinutes = totalAvailableMinutes - totalScheduledMinutes - bufferMinutes;
        if (freeMinutes < 0) freeMinutes = 0;

        return new WeeklyAllocationSummary(
                totalAvailableMinutes,
                totalScheduledMinutes,
                bufferMinutes,
                freeMinutes,
                allocations
        );
    }
}
