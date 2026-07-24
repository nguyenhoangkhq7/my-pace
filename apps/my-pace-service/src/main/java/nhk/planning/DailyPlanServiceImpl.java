package nhk.planning;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nhk.common.UserNotFoundException;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import nhk.goal.GoalService;
import nhk.calendar.FixedEventService;
import nhk.calendar.FixedEventResponse;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.timeblock.TaskTimeBlock;
import nhk.timeblock.TaskTimeBlockDto;
import nhk.timeblock.TaskTimeBlockRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyPlanServiceImpl implements DailyPlanService {
    private final DailyPlanRepository dailyPlanRepository;
    private final DailyPlanTaskRepository dailyPlanTaskRepository;
    private final TaskRepository taskRepository;
    private final DailyPlanMapper dailyPlanMapper;
    private final TaskTimeBlockRepository timeBlockRepository;
    private final GoalService goalService;
    private final UserRepository userRepo;
    private final GoalRepository goalRepository;
    private final FixedEventService eventService;

    @Override
    @Transactional(readOnly = true)
    public DailyPlanDto getDailyPlan(LocalDate planDate, UUID userId) {
        return dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)
                .map(plan -> {
                    DailyPlanDto dto = dailyPlanMapper.toDto(plan);
                    List<DailyPlanTask> planTasks = dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(plan.getId());
                    List<DailyPlanTaskDto> taskDtos = planTasks.stream()
                            .map(dailyPlanMapper::toDto)
                            .collect(Collectors.toList());

                    // Load time blocks for this plan
                    List<TaskTimeBlockDto> timeBlocks = timeBlockRepository
                            .findByDailyPlanIdOrderByStartTimeAsc(plan.getId())
                            .stream()
                            .map(tb -> new TaskTimeBlockDto(
                                tb.getId(),
                                tb.getTaskId(),
                                tb.getDailyPlanId(),
                                tb.getStartTime(),
                                tb.getEndTime(),
                                tb.getPartIndex(),
                                tb.getTotalParts()
                            ))
                            .collect(Collectors.toList());

                    return dto.toBuilder()
                            .tasks(taskDtos)
                            .timeBlocks(timeBlocks)
                            .build();
                })
                .orElse(null);
    }

    @Override
    @Transactional
    public DailyPlanDto planMyDay(PlanMyDayRequest request, UUID userId) {
        DailyPlan plan = dailyPlanRepository.findByUserIdAndPlanDate(userId, request.planDate())
                .orElseGet(() -> {
                    DailyPlan newPlan = new DailyPlan();
                    newPlan.setUserId(userId);
                    newPlan.setPlanDate(request.planDate());
                    return newPlan;
                });

        plan.setAvailableMinutes(request.availableMinutes() != null ? request.availableMinutes() : 0);
        plan = dailyPlanRepository.save(plan);

        // Find existing tasks in the plan to check which ones are being removed
        List<DailyPlanTask> existingPlanTasks = dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(plan.getId());
        List<UUID> newTasksIds = request.tasks() != null
                ? request.tasks().stream().map(PlanMyDayRequest.PlanTaskItem::taskId).collect(Collectors.toList())
                : List.of();

        for (DailyPlanTask pt : existingPlanTasks) {
            Task task = pt.getTask();
            if (task != null && !newTasksIds.contains(task.getId())) {
                // Task is removed from the plan, set status back to Backlog (if not Done)
                if (!"Done".equals(task.getStatus())) {
                    task.setStatus("Backlog");
                    taskRepository.save(task);
                }
            }
        }

        // Clear existing tasks for this plan
        dailyPlanTaskRepository.deleteByDailyPlanId(plan.getId());

        // Add new tasks
        if (request.tasks() != null) {
            for (PlanMyDayRequest.PlanTaskItem item : request.tasks()) {
                Task task = taskRepository.findById(item.taskId())
                        .filter(t -> t.getUserId().equals(userId))
                        .orElseThrow(() -> new EntityNotFoundException("Task not found"));

                DailyPlanTask planTask = new DailyPlanTask();
                planTask.setDailyPlanId(plan.getId());
                planTask.setTask(task);
                planTask.setIsMit(item.isMit() != null ? item.isMit() : false);
                planTask.setSortOrder(item.sortOrder() != null ? item.sortOrder() : 0);
                dailyPlanTaskRepository.save(planTask);

                if (!"Done".equals(task.getStatus())) {
                    task.setStatus("Picked for Today");
                    taskRepository.save(task);

                    // Check if this task has a goal and that goal has a preferTime
                    if (task.getGoalId() != null) {
                        Goal goal = goalRepository.findById(task.getGoalId()).orElse(null);
                        if (goal != null && goal.getPreferTime() != null) {
                            // Check if a timeblock already exists for this task on this day
                            boolean blockExists = !timeBlockRepository.findByTaskIdAndDailyPlanId(task.getId(), plan.getId()).isEmpty();
                            if (!blockExists) {
                                User user = userRepo.findById(userId)
                                        .orElseThrow(() -> new UserNotFoundException("User not found"));
                                String tz = user.getTimezone();
                                ZoneId zoneId = ZoneId.of(tz != null && !tz.isBlank() ? tz : "UTC");
                                int estimatedMinutes = task.getEstimatedMinutes() != null ? task.getEstimatedMinutes() : 60;
                                scheduleTaskTimeBlock(plan, task, goal.getPreferTime(), estimatedMinutes, zoneId);
                            }
                        }
                    }
                }
            }
        }

        return getDailyPlan(request.planDate(), userId);
    }

    @Override
    @Transactional
    public DailyPlanDto confirmPlan(LocalDate planDate, UUID userId) {
        DailyPlan plan = dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)
                .orElseThrow(() -> new EntityNotFoundException("Daily plan not found"));
        plan.setIsConfirmed(true);

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        String tz = user.getTimezone();
        ZoneId zoneId = ZoneId.of(tz != null && !tz.isBlank() ? tz : "UTC");

        plan.setConfirmedAt(OffsetDateTime.now(zoneId));
        dailyPlanRepository.save(plan);
        return getDailyPlan(planDate, userId);
    }

    @Override
    @Transactional
    public DailyPlanDto unconfirmPlan(LocalDate planDate, UUID userId) {
        DailyPlan plan = dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)
                .orElseThrow(() -> new EntityNotFoundException("Daily plan not found"));
        plan.setIsConfirmed(false);
        plan.setConfirmedAt(null);
        dailyPlanRepository.save(plan);
        return getDailyPlan(planDate, userId);
    }

    @Override
    @Transactional
    public void cancelPlan(LocalDate planDate, UUID userId) {
        dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)
                .ifPresent(plan -> {
                    List<DailyPlanTask> planTasks = dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(plan.getId());
                    for (DailyPlanTask pt : planTasks) {
                        Task task = pt.getTask();
                        if (!"Done".equals(task.getStatus())) {
                            task.setStatus("Backlog");
                            taskRepository.save(task);
                        }
                    }
                    // Delete time blocks too
                    timeBlockRepository.deleteByDailyPlanId(plan.getId());
                    dailyPlanTaskRepository.deleteByDailyPlanId(plan.getId());
                    dailyPlanRepository.delete(plan);
                });
    }

    @Override
    @Transactional
    public void toggleTaskDone(UUID dailyPlanTaskId, UUID userId) {
        DailyPlanTask planTask = dailyPlanTaskRepository.findById(dailyPlanTaskId)
                .orElseThrow(() -> new EntityNotFoundException("Plan task not found"));
        
        DailyPlan plan = dailyPlanRepository.findById(planTask.getDailyPlanId())
                .orElseThrow(() -> new EntityNotFoundException("Plan not found"));
                
        if (!plan.getUserId().equals(userId)) {
            throw new EntityNotFoundException("Plan task not found");
        }

        Task task = planTask.getTask();
        boolean wasDone = "Done".equals(task.getStatus());

        if (wasDone) {
            task.setStatus("Picked for Today");
            task.setDoneAt(null);
        } else {
            task.setStatus("Done");

            User user = userRepo.findById(userId)
                    .orElseThrow(() -> new UserNotFoundException("User not found"));
            String tz = user.getTimezone();
            ZoneId zoneId = ZoneId.of(tz != null && !tz.isBlank() ? tz : "UTC");

            task.setDoneAt(OffsetDateTime.now(zoneId));
        }
        taskRepository.save(task);

        if (task.getGoalId() != null) {
            goalService.updateGoalProgress(task.getGoalId());
        }
    }

    @Override
    @Transactional
    public DailyPlanDto reviewPlan(LocalDate planDate, ReviewPlanRequest request, UUID userId) {
        DailyPlan plan = dailyPlanRepository.findByUserIdAndPlanDate(userId, planDate)
                .orElseThrow(() -> new EntityNotFoundException("Daily plan not found"));
        plan.setIsReviewed(true);
        dailyPlanRepository.save(plan);

        if (request != null && request.taskReviews() != null && !request.taskReviews().isEmpty()) {
            LocalDate today = request.today();
            if (today == null) {
                User user = userRepo.findById(userId)
                        .orElseThrow(() -> new UserNotFoundException("User not found"));
                java.time.ZoneId zoneId = java.time.ZoneId.of(
                        user.getTimezone() != null && !user.getTimezone().isBlank() ? user.getTimezone() : "UTC"
                );
                today = LocalDate.now(zoneId);
            }

            final LocalDate finalToday = today;
            DailyPlan todayPlan = dailyPlanRepository.findByUserIdAndPlanDate(userId, finalToday)
                    .orElseGet(() -> {
                        DailyPlan newPlan = new DailyPlan();
                        newPlan.setUserId(userId);
                        newPlan.setPlanDate(finalToday);
                        newPlan.setAvailableMinutes(0);
                        newPlan.setIsConfirmed(false);
                        return dailyPlanRepository.save(newPlan);
                    });

            for (ReviewPlanRequest.TaskReviewItem review : request.taskReviews()) {
                UUID taskId = review.taskId();
                String action = review.action();
                if (taskId == null || action == null) continue;

                Task task = taskRepository.findById(taskId)
                        .filter(t -> t.getUserId().equals(userId))
                        .orElse(null);
                if (task == null) continue;

                if ("DELETE".equalsIgnoreCase(action)) {
                    UUID goalId = task.getGoalId();
                    dailyPlanTaskRepository.deleteByTaskId(taskId);
                    timeBlockRepository.deleteByTaskId(taskId);
                    taskRepository.delete(task);
                    if (goalId != null) {
                        goalService.updateGoalProgress(goalId);
                    }
                } else if ("BACKLOG".equalsIgnoreCase(action)) {
                    task.setStatus("Backlog");
                    taskRepository.save(task);
                } else if ("TODAY".equalsIgnoreCase(action)) {
                    task.setStatus("Picked for Today");
                    taskRepository.save(task);

                    // Add to todayPlan if not exists
                    boolean exists = dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(todayPlan.getId())
                            .stream().anyMatch(pt -> pt.getTask().getId().equals(taskId));
                    if (!exists) {
                        DailyPlanTask planTask = new DailyPlanTask();
                        planTask.setDailyPlanId(todayPlan.getId());
                        planTask.setTask(task);

                        boolean oldIsMit = dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(plan.getId())
                                .stream()
                                .filter(pt -> pt.getTask().getId().equals(taskId))
                                .map(DailyPlanTask::getIsMit)
                                .findFirst()
                                .orElse(task.getIsImportant() != null ? task.getIsImportant() : false);

                        planTask.setIsMit(oldIsMit);
                        planTask.setSortOrder(0);
                        dailyPlanTaskRepository.save(planTask);
                    }
                }
            }
        }

        return getDailyPlan(planDate, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public DailyPlanDto getUnreviewedPlan(LocalDate today, UUID userId) {
        return dailyPlanRepository.findFirstByUserIdAndPlanDateBeforeAndIsConfirmedTrueAndIsReviewedFalseOrderByPlanDateDesc(userId, today)
                .map(plan -> getDailyPlan(plan.getPlanDate(), userId))
                .orElse(null);
    }

    private void scheduleTaskTimeBlock(DailyPlan plan, Task task, java.time.LocalTime preferTime, int estimatedMinutes, java.time.ZoneId zoneId) {
        LocalDate date = plan.getPlanDate();
        java.time.LocalDateTime candidateStart = java.time.LocalDateTime.of(date, preferTime);
        java.time.LocalDateTime candidateEnd = candidateStart.plusMinutes(estimatedMinutes);

        List<FixedEventResponse> fixedEvents = eventService.getEventsInRange(plan.getUserId(), date, date);
        List<TaskTimeBlock> existingBlocks = new java.util.ArrayList<>(timeBlockRepository.findByDailyPlanIdOrderByStartTimeAsc(plan.getId()));

        java.time.LocalDateTime dayEnd = java.time.LocalDateTime.of(date, java.time.LocalTime.MAX);
        
        while (candidateEnd.isBefore(dayEnd) || candidateEnd.equals(dayEnd)) {
            boolean overlap = false;
            
            // Check fixed events
            for (FixedEventResponse ev : fixedEvents) {
                java.time.LocalTime evStartLt = ev.startTime();
                java.time.LocalTime evEndLt = ev.endTime();
                java.time.LocalDateTime evStart = java.time.LocalDateTime.of(date, evStartLt);
                java.time.LocalDateTime evEnd = java.time.LocalDateTime.of(date, evEndLt);
                
                if (candidateStart.isBefore(evEnd) && candidateEnd.isAfter(evStart)) {
                    overlap = true;
                    if (evEnd.isAfter(candidateStart)) {
                        candidateStart = evEnd;
                        candidateEnd = candidateStart.plusMinutes(estimatedMinutes);
                    }
                    break;
                }
            }
            
            if (overlap) continue;
            
            // Check existing time blocks
            for (TaskTimeBlock tb : existingBlocks) {
                if (candidateStart.isBefore(tb.getEndTime()) && candidateEnd.isAfter(tb.getStartTime())) {
                    overlap = true;
                    if (tb.getEndTime().isAfter(candidateStart)) {
                        candidateStart = tb.getEndTime();
                        candidateEnd = candidateStart.plusMinutes(estimatedMinutes);
                    }
                    break;
                }
            }
            
            if (!overlap) {
                TaskTimeBlock tb = new TaskTimeBlock();
                tb.setTaskId(task.getId());
                tb.setDailyPlanId(plan.getId());
                tb.setStartTime(candidateStart);
                tb.setEndTime(candidateEnd);
                tb.setPartIndex(1);
                tb.setTotalParts(1);
                timeBlockRepository.save(tb);
                existingBlocks.add(tb);
                break;
            }
        }
    }
}
