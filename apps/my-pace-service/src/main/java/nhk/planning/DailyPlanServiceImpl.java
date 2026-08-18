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
import nhk.timeblock.TaskTimeBlockRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import nhk.scheduling.AutoScheduleService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Collections;
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
    private final nhk.timelog.TimeLogRepository timeLogRepository;
    private final GoalService goalService;
    private final UserRepository userRepo;
    private final GoalRepository goalRepository;
    private final FixedEventService eventService;
    private final AutoScheduleService autoScheduleService;

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

                    return dto.toBuilder()
                            .tasks(taskDtos)
                            .build();
                })
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DailyPlanDto> getDailyPlansInRange(LocalDate startDate, LocalDate endDate, UUID userId) {
        List<DailyPlan> plans = dailyPlanRepository.findByUserIdAndPlanDateBetweenOrderByPlanDateAsc(userId, startDate, endDate);
        return plans.stream().map(plan -> {
            DailyPlanDto dto = dailyPlanMapper.toDto(plan);
            List<DailyPlanTask> planTasks = dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(plan.getId());
            List<DailyPlanTaskDto> taskDtos = planTasks.stream()
                    .map(dailyPlanMapper::toDto)
                    .collect(Collectors.toList());

            return dto.toBuilder()
                    .tasks(taskDtos)
                    .build();
        }).collect(Collectors.toList());
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

        boolean isConfirmedSwap = Boolean.TRUE.equals(plan.getIsConfirmed());

        List<UUID> newTasksIds = request.tasks() != null 
                ? request.tasks().stream().map(PlanMyDayRequest.PlanTaskItem::taskId).toList() 
                : Collections.emptyList();
        
        List<DailyPlanTask> existingPlanTasks = dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(plan.getId());
        
        for (DailyPlanTask pt : existingPlanTasks) {
            Task task = pt.getTask();
            if (task != null) {
                boolean isRemoved = !newTasksIds.contains(task.getId());
                boolean isUncompleted = !"Done".equals(task.getStatus());
                
                if (isRemoved && isUncompleted) {
                    task.setStatus("Backlog");
                    taskRepository.save(task);
                }
                
                if (isConfirmedSwap && isUncompleted) {
                    java.time.LocalDateTime startOfDay = plan.getPlanDate().atStartOfDay();
                    java.time.LocalDateTime endOfDay = plan.getPlanDate().plusDays(1).atStartOfDay();
                    List<TaskTimeBlock> blocks = timeBlockRepository.findByUserIdAndDateRange(userId, startOfDay, endOfDay);
                    for (TaskTimeBlock b : blocks) {
                        if (b.getTaskId() != null && b.getTaskId().equals(task.getId())) {
                            timeBlockRepository.delete(b);
                        }
                    }
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
                    boolean scheduledByGoal = false;
                    if (task.getGoalId() != null) {
                        Goal goal = goalRepository.findById(task.getGoalId()).orElse(null);
                        if (goal != null && goal.getPreferTime() != null) {
                            final java.time.LocalDate planDateFinal = plan.getPlanDate();
                            boolean blockExists = timeBlockRepository.findByTaskId(task.getId()).stream()
                                    .anyMatch(tb -> tb.getStartTime().toLocalDate().equals(planDateFinal));
                            if (!blockExists) {
                                User user = userRepo.findById(userId)
                                        .orElseThrow(() -> new UserNotFoundException("User not found"));
                                String tz = user.getTimezone();
                                ZoneId zoneId = ZoneId.of(tz != null && !tz.isBlank() ? tz : "UTC");
                                int estimatedMinutes = task.getEstimatedMinutes() != null ? task.getEstimatedMinutes() : 60;
                                scheduleTaskTimeBlock(plan, task, goal.getPreferTime(), estimatedMinutes, zoneId);
                                scheduledByGoal = true;
                            }
                        }
                    }

                    // We removed the manual scheduleTaskTimeBlock for new tasks here
                    // because Auto-Schedule will handle it in bulk and compact the schedule.
                }
            }
        }

        if (isConfirmedSwap) {
            dailyPlanTaskRepository.flush();
            taskRepository.flush();
            timeBlockRepository.flush();
            try {
                autoScheduleService.autoSchedule(userId, 0, true);
            } catch (Exception e) {
                System.err.println("Failed to auto-schedule after swap: " + e.getMessage());
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

        // Transition all TaskTimeBlocks for this plan to BUSY
        java.time.LocalDateTime start = plan.getPlanDate().atStartOfDay();
        java.time.LocalDateTime end = plan.getPlanDate().plusDays(1).atStartOfDay().minusNanos(1);
        List<TaskTimeBlock> blocks = timeBlockRepository.findByUserIdAndDateRange(userId, start, end);
        for (TaskTimeBlock b : blocks) {
            b.setAvailabilityStatus("BUSY");
        }
        timeBlockRepository.saveAll(blocks);

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
                    java.time.LocalDateTime startOfDay = plan.getPlanDate().atStartOfDay();
                    java.time.LocalDateTime endOfDay = plan.getPlanDate().plusDays(1).atStartOfDay();
                    timeBlockRepository.deleteByUserIdAndDate(userId, startOfDay, endOfDay);
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

        LocalDateTime planStart = planDate.atStartOfDay();
        LocalDateTime planEnd = planDate.plusDays(1).atStartOfDay().minusNanos(1);
        List<TaskTimeBlock> pastBlocks = timeBlockRepository.findByUserIdAndDateRange(userId, planStart, planEnd);

        List<UUID> blockIds = pastBlocks.stream().map(TaskTimeBlock::getId).toList();
        List<nhk.timelog.TimeLog> allLogs = timeLogRepository.findByTimeBlockIdIn(blockIds);
        java.util.Map<UUID, List<nhk.timelog.TimeLog>> logsByBlockId = allLogs.stream()
                .collect(java.util.stream.Collectors.groupingBy(nhk.timelog.TimeLog::getTimeBlockId));

        for (TaskTimeBlock tb : pastBlocks) {
            List<nhk.timelog.TimeLog> blockLogs = logsByBlockId.getOrDefault(tb.getId(), List.of());
            int actMins = blockLogs.stream().mapToInt(nhk.timelog.TimeLog::getLoggedMinutes).sum();
            boolean hasLogs = !blockLogs.isEmpty();
            if (actMins > 0) {
                tb.setEndTime(tb.getStartTime().plusMinutes(actMins));
                timeBlockRepository.save(tb);
            } else if (!hasLogs) {
                Task task = tb.getTaskId() != null ? taskRepository.findById(tb.getTaskId()).orElse(null) : null;
                if (task != null && ("Done".equalsIgnoreCase(task.getStatus()) || (task.getActualMinutes() != null && task.getActualMinutes() > 0))) {
                    if (task.getActualMinutes() != null && task.getActualMinutes() > 0) {
                        tb.setEndTime(tb.getStartTime().plusMinutes(task.getActualMinutes()));
                        timeBlockRepository.save(tb);
                    }
                } else {
                    timeBlockRepository.delete(tb);
                }
            }
        }

        boolean hasMovedToToday = false;

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
                } else if ("DONE".equalsIgnoreCase(action)) {
                    task.setStatus("Done");
                    User user = userRepo.findById(userId)
                            .orElseThrow(() -> new UserNotFoundException("User not found"));
                    String tz = user.getTimezone();
                    ZoneId zoneId = ZoneId.of(tz != null && !tz.isBlank() ? tz : "UTC");
                    task.setDoneAt(OffsetDateTime.now(zoneId));
                    taskRepository.save(task);
                    if (task.getGoalId() != null) {
                        goalService.updateGoalProgress(task.getGoalId());
                    }
                } else if ("BACKLOG".equalsIgnoreCase(action)) {
                    task.setStatus("Backlog");
                    taskRepository.save(task);
                } else if ("TODAY".equalsIgnoreCase(action)) {
                    task.setStatus("Picked for Today");
                    taskRepository.save(task);
                    hasMovedToToday = true;

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

            if (hasMovedToToday) {
                try {
                    autoScheduleService.autoSchedule(userId, 15, false);
                } catch (Exception ignored) {}
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
        java.time.LocalDateTime startOfDay = date.atStartOfDay();
        java.time.LocalDateTime endOfDay = date.plusDays(1).atStartOfDay().minusNanos(1);
        List<TaskTimeBlock> existingBlocks = new java.util.ArrayList<>(timeBlockRepository.findByUserIdAndDateRange(plan.getUserId(), startOfDay, endOfDay));

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
                tb.setStartTime(candidateStart);
                tb.setEndTime(candidateEnd);
                tb.setPartIndex(1);
                tb.setTotalParts(1);
                tb.setAvailabilityStatus("BUSY");
                timeBlockRepository.save(tb);
                existingBlocks.add(tb);
                break;
            }
        }
    }
}
