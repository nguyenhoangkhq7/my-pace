package nhk.scheduling;

import lombok.RequiredArgsConstructor;
import nhk.category.Category;
import nhk.category.CategoryRepository;
import nhk.common.UserNotFoundException;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;
import nhk.planning.DailyPlanTask;
import nhk.planning.DailyPlanTaskRepository;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AutoScheduleDataLoader {

    private final UserRepository userRepo;
    private final TaskRepository taskRepository;
    private final DailyPlanRepository dailyPlanRepository;
    private final TaskTimeBlockRepository timeBlockRepository;
    private final CategoryRepository categoryRepository;
    private final DailyPlanTaskRepository dailyPlanTaskRepository;
    private final GoalRepository goalRepository;

    public ScheduleContext loadContext(UUID userId, Integer bufferMinutesInput) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        ZoneId zoneId = ZoneId.of(user.getTimezone() != null && !user.getTimezone().isBlank() ? user.getTimezone() : "UTC");
        LocalDate startDate = LocalDate.now(zoneId);
        LocalDate endOfFirstWeek = startDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        LocalDate endDate = endOfFirstWeek.plusWeeks(1);
        LocalTime wakeTime = user.getWakeTime() != null ? user.getWakeTime() : LocalTime.of(7, 0);
        LocalTime sleepTime = user.getSleepTime() != null ? user.getSleepTime() : LocalTime.of(23, 0);
        int bufferMinutes = bufferMinutesInput != null && bufferMinutesInput >= 0 ? bufferMinutesInput : 15;
        int wakeMin = wakeTime.getHour() * 60 + wakeTime.getMinute();
        int sleepMin = sleepTime.getHour() * 60 + sleepTime.getMinute();

        Map<UUID, Category> categoryMap = categoryRepository.findByUserIdWithTimeContext(userId)
                .stream().collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a));

        List<LocalDate> dateRange = new ArrayList<>();
        LocalDate curr = startDate;
        while (!curr.isAfter(endDate)) {
            dateRange.add(curr);
            curr = curr.plusDays(1);
        }

        List<DailyPlan> plansInRange = dailyPlanRepository.findByUserIdAndPlanDateBetweenOrderByPlanDateAsc(userId, startDate, endDate);
        Map<LocalDate, DailyPlan> planMap = new HashMap<>((int) (plansInRange.size() / 0.75f + 1));
        List<UUID> planIds = new ArrayList<>(plansInRange.size());
        for (DailyPlan plan : plansInRange) {
            planMap.put(plan.getPlanDate(), plan);
            planIds.add(plan.getId());
        }

        List<TaskTimeBlock> allBlocksInRange = timeBlockRepository.findByUserIdAndDateRange(
                userId,
                startDate.atStartOfDay(),
                endDate.atTime(LocalTime.MAX)
        );
        Map<LocalDate, List<TaskTimeBlock>> blocksByDate = allBlocksInRange.stream()
                .collect(Collectors.groupingBy(b -> b.getStartTime().toLocalDate()));

        Map<UUID, List<DailyPlanTask>> planTasksByPlanId = Collections.emptyMap();
        if (!planIds.isEmpty()) {
            List<DailyPlanTask> allPlanTasksInRange = dailyPlanTaskRepository.findByDailyPlanIdIn(planIds);
            planTasksByPlanId = allPlanTasksInRange.stream()
                    .collect(Collectors.groupingBy(DailyPlanTask::getDailyPlanId));
        }

        // Only load active tasks (not Done)
        List<Task> activeTasks = taskRepository.findByUserIdAndStatusNot(userId, "Done");
        List<UUID> taskIds = activeTasks.stream().map(Task::getId).toList();

        Map<UUID, List<TaskTimeBlock>> blocksByTaskId = Collections.emptyMap();
        if (!taskIds.isEmpty()) {
            // Only load time blocks within the scheduling window for these tasks
            List<TaskTimeBlock> taskBlocks = timeBlockRepository.findByTaskIdInAndDateRange(
                    taskIds,
                    startDate.atStartOfDay(),
                    endDate.atTime(LocalTime.MAX)
            );
            blocksByTaskId = taskBlocks.stream().collect(Collectors.groupingBy(TaskTimeBlock::getTaskId));
        }

        Map<UUID, Goal> goalMap = goalRepository.findByUserId(userId)
                .stream().collect(Collectors.toMap(Goal::getId, g -> g, (a, b) -> a));

        return new ScheduleContext(
                userId, zoneId, startDate, endDate, dateRange, bufferMinutes,
                wakeMin, sleepMin, categoryMap, planMap, blocksByDate, planTasksByPlanId,
                goalMap, activeTasks, blocksByTaskId
        );
    }
}
