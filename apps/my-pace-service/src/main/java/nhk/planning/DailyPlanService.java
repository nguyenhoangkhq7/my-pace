package nhk.planning;

import lombok.RequiredArgsConstructor;
import jakarta.persistence.EntityNotFoundException;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.timeblock.TaskTimeBlockDto;
import nhk.timeblock.TaskTimeBlockRepository;
import nhk.user.UserDetailsCustom;
import nhk.goal.GoalService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyPlanService {
    private final DailyPlanRepository dailyPlanRepository;
    private final DailyPlanTaskRepository dailyPlanTaskRepository;
    private final TaskRepository taskRepository;
    private final DailyPlanMapper dailyPlanMapper;
    private final TaskTimeBlockRepository timeBlockRepository;
    private final GoalService goalService;

    @Transactional(readOnly = true)
    public DailyPlanDto getDailyPlan(LocalDate planDate, UserDetailsCustom userDetails) {
        return dailyPlanRepository.findByUserIdAndPlanDate(userDetails.user().getId(), planDate)
                .map(plan -> {
                    DailyPlanDto dto = dailyPlanMapper.toDto(plan);
                    List<DailyPlanTask> planTasks = dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(plan.getId());
                    dto.setTasks(planTasks.stream().map(dailyPlanMapper::toDto).collect(Collectors.toList()));

                    // Load time blocks for this plan
                    List<TaskTimeBlockDto> timeBlocks = timeBlockRepository
                            .findByDailyPlanIdOrderByStartTimeAsc(plan.getId())
                            .stream()
                            .map(tb -> {
                                TaskTimeBlockDto tbDto = new TaskTimeBlockDto();
                                tbDto.setId(tb.getId());
                                tbDto.setTaskId(tb.getTaskId());
                                tbDto.setDailyPlanId(tb.getDailyPlanId());
                                tbDto.setStartTime(tb.getStartTime());
                                tbDto.setEndTime(tb.getEndTime());
                                tbDto.setPartIndex(tb.getPartIndex());
                                tbDto.setTotalParts(tb.getTotalParts());
                                return tbDto;
                            })
                            .collect(Collectors.toList());
                    dto.setTimeBlocks(timeBlocks);

                    return dto;
                })
                .orElse(null);
    }

    @Transactional
    public DailyPlanDto planMyDay(PlanMyDayRequest request, UserDetailsCustom userDetails) {
        DailyPlan plan = dailyPlanRepository.findByUserIdAndPlanDate(userDetails.user().getId(), request.getPlanDate())
                .orElseGet(() -> {
                    DailyPlan newPlan = new DailyPlan();
                    newPlan.setUserId(userDetails.user().getId());
                    newPlan.setPlanDate(request.getPlanDate());
                    return newPlan;
                });

        plan.setAvailableMinutes(request.getAvailableMinutes() != null ? request.getAvailableMinutes() : 0);
        plan = dailyPlanRepository.save(plan);

        // Clear existing tasks for this plan
        dailyPlanTaskRepository.deleteByDailyPlanId(plan.getId());

        // Add new tasks
        if (request.getTasks() != null) {
            for (PlanMyDayRequest.PlanTaskItem item : request.getTasks()) {
                Task task = taskRepository.findById(item.getTaskId())
                        .filter(t -> t.getUserId().equals(userDetails.user().getId()))
                        .orElseThrow(() -> new EntityNotFoundException("Task not found"));

                DailyPlanTask planTask = new DailyPlanTask();
                planTask.setDailyPlanId(plan.getId());
                planTask.setTask(task);
                planTask.setIsMit(item.getIsMit() != null ? item.getIsMit() : false);
                planTask.setSortOrder(item.getSortOrder() != null ? item.getSortOrder() : 0);
                dailyPlanTaskRepository.save(planTask);

                if (!"Done".equals(task.getStatus())) {
                    task.setStatus("Picked for Today");
                    taskRepository.save(task);
                }
            }
        }

        return getDailyPlan(request.getPlanDate(), userDetails);
    }

    @Transactional
    public DailyPlanDto confirmPlan(LocalDate planDate, UserDetailsCustom userDetails) {
        DailyPlan plan = dailyPlanRepository.findByUserIdAndPlanDate(userDetails.user().getId(), planDate)
                .orElseThrow(() -> new EntityNotFoundException("Daily plan not found"));
        plan.setIsConfirmed(true);
        plan.setConfirmedAt(OffsetDateTime.now());
        dailyPlanRepository.save(plan);
        return getDailyPlan(planDate, userDetails);
    }

    @Transactional
    public void cancelPlan(LocalDate planDate, UserDetailsCustom userDetails) {
        dailyPlanRepository.findByUserIdAndPlanDate(userDetails.user().getId(), planDate)
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

    @Transactional
    public void toggleTaskDone(UUID dailyPlanTaskId, Integer addedCount, UserDetailsCustom userDetails) {
        DailyPlanTask planTask = dailyPlanTaskRepository.findById(dailyPlanTaskId)
                .orElseThrow(() -> new EntityNotFoundException("Plan task not found"));
        
        DailyPlan plan = dailyPlanRepository.findById(planTask.getDailyPlanId())
                .orElseThrow(() -> new EntityNotFoundException("Plan not found"));
                
        if (!plan.getUserId().equals(userDetails.user().getId())) {
            throw new EntityNotFoundException("Plan task not found");
        }

        Task task = planTask.getTask();
        boolean wasDone = "Done".equals(task.getStatus());
        int actualMinutes = task.getActualMinutes() != null ? task.getActualMinutes() : 0;

        if (wasDone) {
            task.setStatus("Picked for Today");
            task.setDoneAt(null);
        } else {
            task.setStatus("Done");
            task.setDoneAt(OffsetDateTime.now());
        }
        taskRepository.save(task);

        if (task.getGoalId() != null) {
            int countVal = addedCount != null ? addedCount : 1;
            if (wasDone) {
                // went from Done -> Not Done: subtract
                goalService.updateGoalProgress(task.getGoalId(), -actualMinutes, -countVal);
            } else {
                // went from Not Done -> Done: add
                goalService.updateGoalProgress(task.getGoalId(), actualMinutes, countVal);
            }
        }
    }

    @Transactional
    public DailyPlanDto reviewPlan(LocalDate planDate, UserDetailsCustom userDetails) {
        DailyPlan plan = dailyPlanRepository.findByUserIdAndPlanDate(userDetails.user().getId(), planDate)
                .orElseThrow(() -> new EntityNotFoundException("Daily plan not found"));
        plan.setIsReviewed(true);
        dailyPlanRepository.save(plan);
        return getDailyPlan(planDate, userDetails);
    }
}
