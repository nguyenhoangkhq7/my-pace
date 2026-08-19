package nhk.planning.insight;

import lombok.RequiredArgsConstructor;
import nhk.calendar.CheckinStreakService;
import nhk.common.UserNotFoundException;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;
import nhk.planning.DailyPlanTask;
import nhk.planning.DailyPlanTaskRepository;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyBriefingService {

    private final DailyPlanRepository dailyPlanRepository;
    private final DailyPlanTaskRepository dailyPlanTaskRepository;
    private final TaskRepository taskRepository;
    private final GoalRepository goalRepository;
    private final CheckinStreakService streakService;
    private final UserRepository userRepository;
    private final nhk.calendar.AvailableTimeService availableTimeService;
    private final nhk.timeblock.TaskTimeBlockRepository timeBlockRepository;

    @Transactional(readOnly = true)
    public DailyBriefingResponse getBriefing(UUID userId, LocalDate date) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        ZoneId zoneId = ZoneId.of(user.getTimezone() != null && !user.getTimezone().isBlank() ? user.getTimezone() : "UTC");

        DailyPlan plan = dailyPlanRepository.findByUserIdAndPlanDate(userId, date).orElse(null);
        List<DailyPlanTask> planTasks = plan != null
                ? dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(plan.getId())
                : Collections.emptyList();

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();
        List<nhk.timeblock.TaskTimeBlock> timeBlocks = timeBlockRepository.findByUserIdAndDateRange(userId, startOfDay, endOfDay);

        // === SUMMARY ===
        int scheduledMinutes = planTasks.stream()
                .mapToInt(pt -> getDailyAllocatedMinutes(pt.getTask(), timeBlocks))
                .sum();

        int availableMinutes = 0;
        if (plan != null && plan.getAvailableMinutes() != null && plan.getAvailableMinutes() > 0) {
            availableMinutes = plan.getAvailableMinutes();
        } else {
            try {
                var avail = availableTimeService.getAvailableTime(userId, date);
                if (avail != null) {
                    availableMinutes = avail.availableMinutes();
                }
            } catch (Exception ignored) {}
        }

        int fillPct = availableMinutes > 0 ? (int) Math.round((double) scheduledMinutes * 100.0 / availableMinutes) : 0;
        int mitCount = (int) planTasks.stream().filter(pt -> Boolean.TRUE.equals(pt.getIsMit())).count();
        int habitCount = (int) planTasks.stream()
                .filter(pt -> pt.getTask() != null && "GOAL_SESSION".equals(pt.getTask().getTaskType()))
                .count();

        // === MOTIVATION & PROGRESSION ===
        List<GoalProgression> goalProgressions = calculateGoalProgressions(planTasks, date);
        LocalDateTime now = LocalDateTime.now(zoneId);
        List<Task> overdueTasks = taskRepository.findOverdueTasks(userId, now);

        boolean willClearOverdue = false;
        if (!overdueTasks.isEmpty()) {
            Set<UUID> planTaskIds = planTasks.stream()
                    .map(pt -> pt.getTask().getId())
                    .collect(Collectors.toSet());
            willClearOverdue = overdueTasks.stream().allMatch(t -> planTaskIds.contains(t.getId()));
        }

        // === ALERTS ===
        List<BriefingAlert> alerts = generateAlerts(overdueTasks, date, planTasks, scheduledMinutes, availableMinutes, goalProgressions);

        // === SUGGESTED TASKS ===
        // Sort by priority: MIT > Q1 > Q2 > Q3 > Q4, then overdue > due today > others
        List<DailyPlanTask> sortedPlanTasks = new ArrayList<>(planTasks);
        LocalDateTime nowForSort = LocalDateTime.now(zoneId);
        sortedPlanTasks.sort((a, b) -> {
            Task ta = a.getTask();
            Task tb = b.getTask();
            if (ta == null && tb == null) return 0;
            if (ta == null) return 1;
            if (tb == null) return -1;

            // 1. MIT first
            boolean aMit = Boolean.TRUE.equals(a.getIsMit());
            boolean bMit = Boolean.TRUE.equals(b.getIsMit());
            if (aMit != bMit) return aMit ? -1 : 1;

            // 2. Eisenhower quadrant (lower number = higher priority)
            int aqd = getQuadrant(ta);
            int bqd = getQuadrant(tb);
            if (aqd != bqd) return Integer.compare(aqd, bqd);

            // 3. Due status within same quadrant: overdue > due today > others
            int adp = getDuePriority(ta.getDueDate(), nowForSort, date);
            int bdp = getDuePriority(tb.getDueDate(), nowForSort, date);
            return Integer.compare(adp, bdp);
        });

        // Greedy fit: mark tasks fitsToday=true until available budget is exhausted
        int remainingBudget = availableMinutes;
        Set<UUID> fitIds = new java.util.LinkedHashSet<>();
        for (DailyPlanTask pt : sortedPlanTasks) {
            Task t = pt.getTask();
            if (t == null) continue;
            int minutes = getDailyAllocatedMinutes(t, timeBlocks);
            if (remainingBudget >= minutes) {
                fitIds.add(t.getId());
                remainingBudget -= minutes;
            }
        }

        List<BriefingTaskItem> briefingTasks = sortedPlanTasks.stream()
                .map(pt -> {
                    Task t = pt.getTask();
                    if (t == null) return null;
                    String categoryName = t.getCategory() != null ? t.getCategory().getName() : null;
                    String categoryColor = t.getCategory() != null ? t.getCategory().getColor() : null;
                    String goalTitle = null;
                    if (t.getGoalId() != null) {
                        goalTitle = goalRepository.findById(t.getGoalId()).map(Goal::getTitle).orElse(null);
                    }
                    int dailyMin = getDailyAllocatedMinutes(t, timeBlocks);
                    return new BriefingTaskItem(
                            t.getId(),
                            t.getTitle(),
                            dailyMin,
                            t.getEstimatedMinutes() != null ? t.getEstimatedMinutes() : 25,
                            Boolean.TRUE.equals(t.getIsUrgent()),
                            Boolean.TRUE.equals(t.getIsImportant()),
                            categoryName,
                            categoryColor,
                            goalTitle,
                            t.getDueDate(),
                            Boolean.TRUE.equals(pt.getIsMit()),
                            t.getTaskType(),
                            t.getIsSplittable(),
                            t.getMaxDailyDuration(),
                            fitIds.contains(t.getId())
                    );
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        int streak = streakService.getStreak(userId, zoneId);

        return new DailyBriefingResponse(
                date,
                availableMinutes,
                scheduledMinutes,
                fillPct,
                planTasks.size(),
                mitCount,
                habitCount,
                briefingTasks,
                alerts,
                streak,
                goalProgressions,
                willClearOverdue
        );
    }

    private int getDailyAllocatedMinutes(Task t, List<nhk.timeblock.TaskTimeBlock> timeBlocks) {
        if (t == null) return 0;
        int tbMinutes = timeBlocks.stream()
                .filter(b -> b.getTaskId().equals(t.getId()) && b.getStartTime() != null && b.getEndTime() != null)
                .mapToInt(b -> (int) ChronoUnit.MINUTES.between(b.getStartTime(), b.getEndTime()))
                .sum();
        if (tbMinutes > 0) {
            return tbMinutes;
        }

        int est = t.getEstimatedMinutes() != null ? t.getEstimatedMinutes() : 25;
        int act = t.getActualMinutes() != null ? t.getActualMinutes() : 0;
        int rem = Math.max(0, est - act);
        int fallback = rem > 0 ? rem : est;
        if (Boolean.TRUE.equals(t.getIsSplittable()) && t.getMaxDailyDuration() != null && t.getMaxDailyDuration() > 0) {
            fallback = Math.min(t.getMaxDailyDuration(), fallback);
        }
        return fallback;
    }

    private List<BriefingAlert> generateAlerts(List<Task> overdueTasks,
                                              LocalDate date,
                                              List<DailyPlanTask> planTasks,
                                              int scheduledMin,
                                              int availableMin,
                                              List<GoalProgression> goalProgressions) {
        List<BriefingAlert> alerts = new ArrayList<>();

        // 1. Overdue tasks
        if (!overdueTasks.isEmpty()) {
            alerts.add(new BriefingAlert(
                    "OVERDUE",
                    "critical",
                    overdueTasks.size() + " task quá hạn",
                    overdueTasks.size(),
                    null
            ));
        }

        // 2. Due today (in plan or backlog)
        long dueTodayCount = planTasks.stream()
                .filter(pt -> pt.getTask() != null && pt.getTask().getDueDate() != null
                        && pt.getTask().getDueDate().toLocalDate().equals(date))
                .count();
        if (dueTodayCount > 0) {
            alerts.add(new BriefingAlert(
                    "DUE_TODAY",
                    "warning",
                    dueTodayCount + " task hết hạn hôm nay",
                    (int) dueTodayCount,
                    null
            ));
        }

        // 3. Goal behind schedule
        for (GoalProgression gp : goalProgressions) {
            if (gp.endDate() != null && gp.daysRemaining() >= 0) {
                Goal goal = goalRepository.findById(gp.goalId()).orElse(null);
                if (goal != null && goal.getStartDate() != null) {
                    long totalDays = ChronoUnit.DAYS.between(goal.getStartDate(), goal.getEndDate());
                    long elapsedDays = ChronoUnit.DAYS.between(goal.getStartDate(), date);
                    if (totalDays > 0 && elapsedDays > 0) {
                        int expectedPct = (int) Math.min(100, Math.round((double) elapsedDays * 100.0 / totalDays));
                        int behindPct = expectedPct - gp.currentPct();
                        if (behindPct > 10) {
                            alerts.add(new BriefingAlert(
                                    "GOAL_BEHIND",
                                    "warning",
                                    "\"" + gp.goalTitle() + "\" chậm " + behindPct + "% tiến độ",
                                    gp.todayTaskCount(),
                                    gp.goalTitle()
                            ));
                        }
                    }
                }
            }
        }

        return alerts;
    }

    private List<GoalProgression> calculateGoalProgressions(List<DailyPlanTask> planTasks, LocalDate today) {
        Map<UUID, List<DailyPlanTask>> byGoal = planTasks.stream()
                .filter(pt -> pt.getTask() != null && pt.getTask().getGoalId() != null)
                .collect(Collectors.groupingBy(pt -> pt.getTask().getGoalId()));

        List<GoalProgression> result = new ArrayList<>();
        for (Map.Entry<UUID, List<DailyPlanTask>> entry : byGoal.entrySet()) {
            Goal goal = goalRepository.findById(entry.getKey()).orElse(null);
            if (goal == null) continue;

            long totalTasks = taskRepository.countByGoalId(goal.getId());
            long doneTasks = taskRepository.countByGoalIdAndStatus(goal.getId(), "Done");
            int currentPct = totalTasks > 0
                    ? (int) Math.round((double) doneTasks * 100.0 / totalTasks)
                    : (goal.getProgressPct() != null ? goal.getProgressPct() : 0);

            long todayUndoneTasks = entry.getValue().stream()
                    .filter(pt -> pt.getTask() != null && !"Done".equals(pt.getTask().getStatus()))
                    .count();
            int projectedPct = totalTasks > 0
                    ? (int) Math.min(100, Math.round((double) (doneTasks + todayUndoneTasks) * 100.0 / totalTasks))
                    : currentPct;

            int daysRemaining = goal.getEndDate() != null
                    ? (int) ChronoUnit.DAYS.between(today, goal.getEndDate())
                    : -1;

            result.add(new GoalProgression(
                    goal.getId(),
                    goal.getTitle(),
                    currentPct,
                    projectedPct,
                    entry.getValue().size(),
                    goal.getEndDate(),
                    daysRemaining
            ));
        }
        return result;
    }

    /** Returns Eisenhower quadrant number (1=highest priority, 4=lowest). */
    private int getQuadrant(Task task) {
        boolean urgent = Boolean.TRUE.equals(task.getIsUrgent());
        boolean important = Boolean.TRUE.equals(task.getIsImportant());
        if (urgent && important) return 1;
        if (!urgent && important) return 2;
        if (urgent) return 3;
        return 4;
    }

    /**
     * Returns due-date priority for sorting within same quadrant.
     * Lower number = higher priority.
     * 0 = overdue, 1 = due today, 2 = future/none
     */
    private int getDuePriority(LocalDateTime dueDate, LocalDateTime now, LocalDate today) {
        if (dueDate == null) return 2;
        LocalDate dueDay = dueDate.toLocalDate();
        if (dueDay.isBefore(today)) return 0;
        if (dueDay.isEqual(today)) return 1;
        return 2;
    }
}
