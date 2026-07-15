package nhk.calendar;

import lombok.RequiredArgsConstructor;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DailyCheckinServiceImpl implements DailyCheckinService {

    private final UserRepository userRepo;
    private final DailyCheckinRepository checkinRepo;
    private final GoalRepository goalRepo;
    private final TaskRepository taskRepo;
    private final DailyPlanRepository dailyPlanRepo;
    private final DailyPlanTaskRepository dailyPlanTaskRepo;
    private final TaskTimeBlockRepository taskTimeBlockRepo;
    private final FixedEventService eventService;
    private final AvailableTimeService availableTimeService;

    @Override
    @Transactional
    public AvailableTimeResponse checkin(UUID userId, LocalDate date, LocalTime checkinTime) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        DailyCheckin checkin = checkinRepo.findByUserIdAndCheckinDate(userId, date)
                .orElseGet(() -> DailyCheckin.builder()
                        .user(user)
                        .checkinDate(date)
                        .build());

        // Freeze checkinTime once recorded. Do not overwrite if already set.
        if (checkin.getCheckinTime() == null) {
            checkin.setCheckinTime(checkinTime != null ? checkinTime : LocalTime.now(java.time.ZoneId.of(
                    user.getTimezone() != null && !user.getTimezone().isBlank() ? user.getTimezone() : "UTC"
            )));
            checkinRepo.save(checkin);

            // Auto-generate daily tasks for active goals
            generateDailyTasksForGoals(userId, date);
        }

        return availableTimeService.getAvailableTime(userId, date);
    }

    private void generateDailyTasksForGoals(UUID userId, LocalDate date) {
        List<Goal> activeGoals = goalRepo.findByUserIdAndStatus(userId, "In Progress");
        if (activeGoals.isEmpty()) return;

        User user = userRepo.findById(userId).orElse(null);
        if (user == null) return;
        java.time.ZoneId zoneId = java.time.ZoneId.of(
                user.getTimezone() != null && !user.getTimezone().isBlank() ? user.getTimezone() : "UTC"
        );

        DailyPlan plan = null;

        for (Goal goal : activeGoals) {
            if (Boolean.TRUE.equals(goal.getAutoCreateTask())) {
                boolean isTimeBoxed = "Time-boxed".equals(goal.getGoalType());
                if (!isTimeBoxed) continue;

                if (taskRepo.existsByGoalIdAndDueDate(goal.getId(), date)) {
                    continue;
                }
                
                // For Habit (Time-boxed), check start/end date and days of week
                if (goal.getStartDate() != null && date.isBefore(goal.getStartDate())) continue;
                if (goal.getEndDate() != null && date.isAfter(goal.getEndDate())) continue;
                
                int dayOfWeek = date.getDayOfWeek().getValue();
                String daysStr = goal.getDaysOfWeek() != null ? goal.getDaysOfWeek() : "1,2,3,4,5,6,7";
                String[] days = daysStr.split(",");
                boolean matchDay = false;
                for (String d : days) {
                    if (d.trim().equals(String.valueOf(dayOfWeek))) {
                        matchDay = true;
                        break;
                    }
                }
                if (!matchDay) continue;

                int estimatedMinutes = goal.getDurationMinutes() != null ? goal.getDurationMinutes() : 60;
                if (estimatedMinutes <= 0) continue;

                Task task = new Task();
                task.setUserId(userId);
                task.setGoalId(goal.getId());
                task.setCategoryId(goal.getCategoryId());
                task.setTitle(goal.getTitle());
                task.setEstimatedMinutes(estimatedMinutes);
                task.setActualMinutes(0);
                task.setIsImportant(true);
                task.setIsUrgent(false);
                task.setStatus("Picked for Today");
                task.setDueDate(date.atStartOfDay());
                task.setTaskType("GOAL_SESSION");

                task = taskRepo.save(task);

                if (plan == null) {
                    plan = dailyPlanRepo.findByUserIdAndPlanDate(userId, date)
                            .orElseGet(() -> {
                                DailyPlan newPlan = new DailyPlan();
                                newPlan.setUserId(userId);
                                newPlan.setPlanDate(date);
                                newPlan.setAvailableMinutes(0);
                                newPlan.setIsConfirmed(false);
                                return dailyPlanRepo.save(newPlan);
                            });
                }

                final UUID savedTaskId = task.getId();
                boolean linkExists = dailyPlanTaskRepo.findByDailyPlanIdOrderBySortOrderAsc(plan.getId())
                        .stream().anyMatch(pt -> pt.getTask().getId().equals(savedTaskId));
                
                if (!linkExists) {
                    DailyPlanTask planTask = new DailyPlanTask();
                    planTask.setDailyPlanId(plan.getId());
                    planTask.setTask(task);
                    planTask.setIsMit(task.getIsImportant());
                    planTask.setSortOrder(0);
                    dailyPlanTaskRepo.save(planTask);
                }

                // If Time-boxed and has preferTime, schedule it
                if (goal.getPreferTime() != null) {
                    LocalTime preferTime = goal.getPreferTime();
                    scheduleTaskTimeBlock(plan, task, preferTime, estimatedMinutes, zoneId);
                }
            }
        }
    }

    private void scheduleTaskTimeBlock(DailyPlan plan, Task task, LocalTime preferTime, int estimatedMinutes, java.time.ZoneId zoneId) {
        LocalDate date = plan.getPlanDate();
        java.time.LocalDateTime candidateStart = java.time.LocalDateTime.of(date, preferTime);
        java.time.LocalDateTime candidateEnd = candidateStart.plusMinutes(estimatedMinutes);

        List<FixedEventResponse> fixedEvents = eventService.getEventsInRange(plan.getUserId(), date, date);
        // Create mutable list from repo
        List<TaskTimeBlock> existingBlocks = new ArrayList<>(taskTimeBlockRepo.findByDailyPlanIdOrderByStartTimeAsc(plan.getId()));

        java.time.LocalDateTime dayEnd = java.time.LocalDateTime.of(date, LocalTime.MAX);
        
        while (candidateEnd.isBefore(dayEnd) || candidateEnd.equals(dayEnd)) {
            boolean overlap = false;
            
            // Check fixed events
            for (FixedEventResponse ev : fixedEvents) {
                LocalTime evStartLt = ev.startTime();
                LocalTime evEndLt = ev.endTime();
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
                taskTimeBlockRepo.save(tb);
                existingBlocks.add(tb);
                break;
            }
        }
    }
}
