package nhk.task.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nhk.auth.SecurityUtils;
import nhk.task.dto.request.AutoScheduleRequest;
import nhk.task.dto.request.ScheduledTaskRequest;
import nhk.task.dto.request.ScheduledTaskUpdateRequest;
import nhk.task.dto.response.ScheduledTaskResponse;
import nhk.task.dto.response.TaskResponse;
import nhk.task.entity.Category;
import nhk.task.entity.Event;
import nhk.task.entity.RecurrenceEvent;
import nhk.task.entity.ScheduledTask;
import nhk.task.entity.Task;
import nhk.task.mapper.TaskMapper;
import nhk.task.repository.EventRepository;
import nhk.task.repository.RecurrenceEventRepository;
import nhk.task.repository.ScheduledTaskRepository;
import nhk.task.repository.TaskRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduledTaskService {
    private static final LocalTime DEFAULT_WORK_START = LocalTime.of(8, 0);
    private static final LocalTime DEFAULT_WORK_END = LocalTime.of(22, 0);
    private static final int DEFAULT_DURATION_MINUTES = 30;
    private static final int SEARCH_DAYS = 7;
    private static final int START_BUFFER_MINUTES = 15;

    private final ScheduledTaskRepository scheduledTaskRepository;
    private final TaskRepository taskRepository;
    private final EventRepository eventRepository;
    private final RecurrenceEventRepository recurrenceEventRepository;
    private final TaskMapper taskMapper;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ScheduledTaskResponse> getScheduledTasks() {
        User user = getCurrentUser();
        return scheduledTaskRepository.findAllByUser_IdOrderByStartTimeAsc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ScheduledTaskResponse getScheduledTask(Integer id) {
        User user = getCurrentUser();
        ScheduledTask scheduledTask = scheduledTaskRepository.findByIdAndUser_Id(id, user.getId())
                .orElseThrow(() -> new EntityNotFoundException("Scheduled task not found with id: " + id));
        return toResponse(scheduledTask);
    }

    @Transactional
    public ScheduledTaskResponse scheduleTask(ScheduledTaskRequest request) {
        validateTimeRange(request.startTime(), request.endTime());

        User user = getCurrentUser();
        Task task = taskRepository.findByIdAndUserId(request.taskId(), user.getId())
                .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + request.taskId()));

        scheduledTaskRepository.findByTask_IdAndUser_Id(task.getId(), user.getId())
                .ifPresent(existing -> {
                    scheduledTaskRepository.delete(existing);
                    scheduledTaskRepository.flush();
                });

        ensureSlotAvailable(user.getId(), request.startTime(), request.endTime(), null);
        return saveScheduledTask(user, task, request.startTime(), request.endTime());
    }

    @Transactional
    public ScheduledTaskResponse updateScheduledTask(Integer id, ScheduledTaskUpdateRequest request) {
        validateTimeRange(request.startTime(), request.endTime());

        User user = getCurrentUser();
        ScheduledTask scheduledTask = scheduledTaskRepository.findByIdAndUser_Id(id, user.getId())
                .orElseThrow(() -> new EntityNotFoundException("Scheduled task not found with id: " + id));

        ensureSlotAvailable(user.getId(), request.startTime(), request.endTime(), scheduledTask.getId());

        scheduledTask.setStartTime(request.startTime());
        scheduledTask.setEndTime(request.endTime());
        scheduledTask.setDateApplied(request.startTime().toLocalDate());
        return toResponse(scheduledTaskRepository.save(scheduledTask));
    }

    @Transactional
    public void unscheduleTask(Integer id) {
        User user = getCurrentUser();
        ScheduledTask scheduledTask = scheduledTaskRepository.findByIdAndUser_Id(id, user.getId())
                .orElseThrow(() -> new EntityNotFoundException("Scheduled task not found with id: " + id));
        scheduledTaskRepository.delete(scheduledTask);
    }

    @Transactional
    public ScheduledTaskResponse autoSchedule(AutoScheduleRequest request) {
        User user = getCurrentUser();
        Task task = taskRepository.findByIdAndUserId(request.taskId(), user.getId())
                .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + request.taskId()));

        scheduledTaskRepository.findByTask_IdAndUser_Id(task.getId(), user.getId())
                .ifPresent(existing -> {
                    scheduledTaskRepository.delete(existing);
                    scheduledTaskRepository.flush();
                });

        int durationMinutes = task.getEstimatedMinutes() != null ? task.getEstimatedMinutes() : DEFAULT_DURATION_MINUTES;
        Category category = task.getCategory();
        LocalTime workStart = resolveWorkStart(category);
        LocalTime workEnd = resolveWorkEnd(category);
        LocalDateTime searchStart = LocalDateTime.now().plusMinutes(START_BUFFER_MINUTES);
        LocalDateTime searchLimit = resolveSearchLimit(task.getDueDate(), searchStart);

        List<TimeSlot> busySlots = getBusySlots(user.getId());
        LocalDateTime freeSlot = findFreeSlot(searchStart, searchLimit, durationMinutes, workStart, workEnd, busySlots);
        if (freeSlot == null) {
            throw new IllegalStateException("Không tìm thấy khung giờ trống phù hợp trong vòng 7 ngày tới!");
        }

        return saveScheduledTask(user, task, freeSlot, freeSlot.plusMinutes(durationMinutes));
    }

    private ScheduledTaskResponse saveScheduledTask(User user, Task task, LocalDateTime startTime, LocalDateTime endTime) {
        ScheduledTask scheduledTask = new ScheduledTask();
        scheduledTask.setUser(userRepository.getReferenceById(user.getId()));
        scheduledTask.setTask(task);
        scheduledTask.setStartTime(startTime);
        scheduledTask.setEndTime(endTime);
        scheduledTask.setDateApplied(startTime.toLocalDate());
        return toResponse(scheduledTaskRepository.save(scheduledTask));
    }

    private void ensureSlotAvailable(Integer userId, LocalDateTime startTime, LocalDateTime endTime, Integer excludedScheduledTaskId) {
        List<TimeSlot> busySlots = getBusySlots(userId).stream()
                .filter(slot -> excludedScheduledTaskId == null || slot.scheduledTaskId() == null || !slot.scheduledTaskId().equals(excludedScheduledTaskId))
                .toList();

        for (TimeSlot slot : busySlots) {
            if (overlaps(startTime, endTime, slot.start(), slot.end())) {
                throw new IllegalStateException("Khung giờ này đã bị trùng với lịch bận khác");
            }
        }
    }

    private LocalDateTime findFreeSlot(LocalDateTime searchStart, LocalDateTime searchLimit, int durationMinutes,
                                       LocalTime workStart, LocalTime workEnd, List<TimeSlot> busySlots) {
        LocalDate currentDate = searchStart.toLocalDate();
        LocalDate lastDate = searchLimit.toLocalDate();

        while (!currentDate.isAfter(lastDate)) {
            LocalDateTime dayStart = currentDate.atTime(workStart);
            LocalDateTime dayEnd = currentDate.atTime(workEnd);

            if (dayStart.isAfter(searchLimit)) {
                return null;
            }

            LocalDateTime candidate = searchStart.isAfter(dayStart) ? searchStart : dayStart;
            if (candidate.plusMinutes(durationMinutes).isAfter(searchLimit)) {
                return null;
            }
            if (candidate.plusMinutes(durationMinutes).isAfter(dayEnd)) {
                currentDate = currentDate.plusDays(1);
                searchStart = currentDate.atTime(workStart);
                continue;
            }

            List<TimeSlot> daySlots = busySlots.stream()
                    .filter(slot -> overlaps(slot.start(), slot.end(), dayStart, dayEnd))
                    .sorted(Comparator.comparing(TimeSlot::start))
                    .toList();

            for (TimeSlot busy : daySlots) {
                if (candidate.plusMinutes(durationMinutes).isBefore(busy.start()) || candidate.plusMinutes(durationMinutes).isEqual(busy.start())) {
                    return candidate;
                }
                if (candidate.isBefore(busy.end())) {
                    candidate = busy.end();
                }
                if (candidate.plusMinutes(durationMinutes).isAfter(dayEnd)) {
                    break;
                }
            }

            if (!candidate.plusMinutes(durationMinutes).isAfter(dayEnd) && !candidate.plusMinutes(durationMinutes).isAfter(searchLimit)) {
                return candidate;
            }

            currentDate = currentDate.plusDays(1);
            searchStart = currentDate.atTime(workStart);
        }

        return null;
    }

    private List<TimeSlot> getBusySlots(Integer userId) {
        List<TimeSlot> slots = new ArrayList<>();

        for (Event event : eventRepository.findAllByUser_IdOrderByStartAtAsc(userId)) {
            slots.add(new TimeSlot(event.getStartAt(), event.getEndAt(), null));
        }

        for (RecurrenceEvent recurrenceEvent : recurrenceEventRepository.findAllByUser_IdAndIsCancelledFalseOrderByStartAtAsc(userId)) {
            slots.add(new TimeSlot(recurrenceEvent.getStartAt(), recurrenceEvent.getEndAt(), null));
        }

        for (ScheduledTask scheduledTask : scheduledTaskRepository.findAllByUser_Id(userId)) {
            slots.add(new TimeSlot(scheduledTask.getStartTime(), scheduledTask.getEndTime(), scheduledTask.getId()));
        }

        slots.sort(Comparator.comparing(TimeSlot::start));
        return slots;
    }

    private boolean overlaps(LocalDateTime leftStart, LocalDateTime leftEnd, LocalDateTime rightStart, LocalDateTime rightEnd) {
        return leftStart.isBefore(rightEnd) && leftEnd.isAfter(rightStart);
    }

    private LocalDateTime resolveSearchLimit(LocalDateTime dueDate, LocalDateTime searchStart) {
        LocalDateTime sevenDaysLater = searchStart.plusDays(SEARCH_DAYS);
        if (dueDate == null) {
            return sevenDaysLater;
        }
        if (dueDate.isBefore(searchStart)) {
            return sevenDaysLater;
        }
        return dueDate.isAfter(sevenDaysLater) ? sevenDaysLater : dueDate;
    }

    private LocalTime resolveWorkStart(Category category) {
        if (category != null && category.getPreferredStartTime() != null) {
            return category.getPreferredStartTime();
        }
        return DEFAULT_WORK_START;
    }

    private LocalTime resolveWorkEnd(Category category) {
        if (category != null && category.getPreferredEndTime() != null) {
            return category.getPreferredEndTime();
        }
        return DEFAULT_WORK_END;
    }

    private void validateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (endTime.isBefore(startTime) || endTime.isEqual(startTime)) {
            throw new IllegalArgumentException("endTime must be after startTime");
        }
    }

    private ScheduledTaskResponse toResponse(ScheduledTask st) {
        Task task = st.getTask();
        TaskResponse taskResp = taskMapper.toResponse(task);
        String categoryName = task.getCategory() != null ? task.getCategory().getName() : "Uncategorized";
        return new ScheduledTaskResponse(
                st.getId(),
                task.getId(),
                task.getTitle(),
                categoryName,
                getCategoryColor(categoryName),
                st.getStartTime(),
                st.getEndTime(),
                st.getDateApplied(),
                taskResp
        );
    }

    private String getCategoryColor(String name) {
        return switch (name) {
            case "Work" -> "#3b82f6";
            case "Personal" -> "#10b981";
            case "Learning" -> "#8b5cf6";
            case "Health" -> "#14b8a6";
            default -> "#94a3b8";
        };
    }

    private User getCurrentUser() {
        return SecurityUtils.getCurrentUser()
                .orElseThrow(() -> new AccessDeniedException("User not authenticated"));
    }

    private record TimeSlot(LocalDateTime start, LocalDateTime end, Integer scheduledTaskId) {
    }
}




