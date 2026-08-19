package nhk.scheduling;

import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanTask;
import nhk.task.Task;
import nhk.timeblock.TaskTimeBlock;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskPriorityScorer {

    private final InMemoryBitmapScheduler bitmapScheduler;

    public TaskQueueResult buildTaskQueues(ScheduleContext ctx) {
        Map<UUID, Task> userTaskMap = ctx.activeTasks().stream()
                .collect(Collectors.toMap(Task::getId, t -> t, (a, b) -> a));

        Set<LocalDate> datesWithDailyPlan = new HashSet<>();
        Map<UUID, LocalDate> taskIdToPickedDateMap = new HashMap<>();

        for (Map.Entry<UUID, List<DailyPlanTask>> entry : ctx.dailyPlanTasksByPlanId().entrySet()) {
            DailyPlan p = ctx.planMap().values().stream()
                    .filter(plan -> plan.getId().equals(entry.getKey()))
                    .findFirst().orElse(null);
            if (p != null) {
                datesWithDailyPlan.add(p.getPlanDate());
                for (DailyPlanTask pt : entry.getValue()) {
                    taskIdToPickedDateMap.put(pt.getTask().getId(), p.getPlanDate());
                }
            }
        }

        Map<LocalDate, Integer> cumulativeFreeTimeMap = calculateCumulativeFreeTimeMap(ctx);
        int totalFreeSoFar = cumulativeFreeTimeMap.values().stream().max(Integer::compareTo).orElse(0);

        Map<LocalDate, List<TaskQueueItem>> dateTaskQueues = new HashMap<>();
        List<TaskQueueItem> backlogQueue = new ArrayList<>();

        for (Task t : ctx.activeTasks()) {
            if (t.getEstimatedMinutes() == null || t.getEstimatedMinutes() <= 0) continue;
            int est = t.getEstimatedMinutes();
            int act = t.getActualMinutes() != null ? t.getActualMinutes() : 0;

            LocalDateTime nowLdt = LocalDateTime.now(ctx.zoneId());
            List<TaskTimeBlock> existingTaskBlocks = ctx.taskTimeBlocksByTaskId().getOrDefault(t.getId(), Collections.emptyList());
            int busyMinutes = 0;
            for (TaskTimeBlock b : existingTaskBlocks) {
                if ("BUSY".equalsIgnoreCase(b.getAvailabilityStatus()) && b.getEndTime().isAfter(nowLdt)) {
                    busyMinutes += (int) java.time.Duration.between(b.getStartTime(), b.getEndTime()).toMinutes();
                }
            }

            int rem = est - act - busyMinutes;
            if (rem <= 0) continue;

            boolean isUrgent = Boolean.TRUE.equals(t.getIsUrgent());
            boolean isImportant = Boolean.TRUE.equals(t.getIsImportant());

            int trueSlackTime = calculateTrueSlackTime(t, ctx, cumulativeFreeTimeMap, totalFreeSoFar, rem);
            boolean isDueToday = t.getDueDate() != null && t.getDueDate().toLocalDate().equals(ctx.startDate());
            boolean isHighRisk = isDueToday || (trueSlackTime < 480) || (trueSlackTime < rem * 0.5);

            int priorityRank;
            if (isUrgent && isImportant) {
                // Rank 0: High Risk Q1, Rank 1: Low Risk / Standard Q1
                priorityRank = isHighRisk ? 0 : 1;
            } else if (!isUrgent && isImportant) {
                // Rank 2: Standard Q2
                priorityRank = 2;
            } else if (isUrgent && !isImportant) {
                if (isHighRisk) {
                    priorityRank = 0; // Rank 0: Escalated Q3
                } else if (t.getDueDate() != null) {
                    priorityRank = 4; // Rank 4: Demoted Q3 (Low Risk)
                } else {
                    priorityRank = 3; // Rank 3: Standard Q3
                }
            } else {
                priorityRank = 4; // Rank 4: Q4
            }
            
            String statusWarning = "SAFE";
            if (trueSlackTime < 0) {
                statusWarning = "INFEASIBLE";
            } else if (isHighRisk) {
                statusWarning = "HIGH_RISK";
            }

            TaskQueueItem item = new TaskQueueItem(t, rem, priorityRank, statusWarning);
            LocalDate pickedDate = taskIdToPickedDateMap.get(t.getId());

            if (pickedDate != null) {
                dateTaskQueues.computeIfAbsent(pickedDate, k -> new ArrayList<>()).add(item);
            } else {
                backlogQueue.add(item);
            }
        }

        Comparator<TaskQueueItem> queueComparator = getQueueComparator(ctx);

        for (List<TaskQueueItem> queue : dateTaskQueues.values()) {
            queue.sort(queueComparator);
        }
        backlogQueue.sort(queueComparator);

        return new TaskQueueResult(dateTaskQueues, backlogQueue, datesWithDailyPlan, userTaskMap);
    }

    public static Comparator<TaskQueueItem> getQueueComparator(ScheduleContext ctx) {
        return (a, b) -> {
            if (a.priorityRank != b.priorityRank) return Integer.compare(a.priorityRank, b.priorityRank);
            
            // Soft deadline cho task Gấp nhưng không có Hạn chót: 23:59 Chủ Nhật của tuần lập lịch hiện tại
            LocalDateTime softDeadline = ctx.startDate().with(java.time.temporal.TemporalAdjusters.nextOrSame(java.time.DayOfWeek.SUNDAY)).atTime(23, 59);
            
            LocalDateTime aDue = a.task.getDueDate() != null ? a.task.getDueDate() : (Boolean.TRUE.equals(a.task.getIsUrgent()) ? softDeadline : null);
            LocalDateTime bDue = b.task.getDueDate() != null ? b.task.getDueDate() : (Boolean.TRUE.equals(b.task.getIsUrgent()) ? softDeadline : null);
            
            if (aDue != null && bDue != null && !aDue.equals(bDue)) {
                return aDue.compareTo(bDue);
            } else if (aDue != null && bDue == null) {
                return -1;
            } else if (aDue == null && bDue != null) {
                return 1;
            }
            // "Task nào tốn ít thời gian (Remaining Minutes) hơn thì làm trước" -> Ascending order
            return Integer.compare(a.remainingMinutes, b.remainingMinutes);
        };
    }

    public Map<LocalDate, Integer> calculateCumulativeFreeTimeMap(ScheduleContext ctx) {
        Map<LocalDate, Integer> cumulativeFreeTimeMap = new HashMap<>();
        int totalFreeSoFar = 0;
        
        java.time.LocalTime now = java.time.LocalTime.now(ctx.zoneId());
        int nowMin = now.getHour() * 60 + now.getMinute();

        for (LocalDate d : ctx.dateRange()) {
            int freeToday = 0;
            int startMin = d.equals(ctx.startDate()) ? nowMin : 0;
            List<InMemoryBitmapScheduler.ScheduleGap> gaps = bitmapScheduler.findFreeGaps(ctx.userId(), d, startMin, 1440, 1);
            for (InMemoryBitmapScheduler.ScheduleGap gap : gaps) {
                freeToday += gap.durationMin();
            }
            totalFreeSoFar += freeToday;
            cumulativeFreeTimeMap.put(d, totalFreeSoFar);
        }
        return cumulativeFreeTimeMap;
    }

    public int calculateTrueSlackTime(Task t, ScheduleContext ctx, Map<LocalDate, Integer> cumulativeFreeTimeMap, int totalFreeSoFar, int rem) {
        int availableToDue = Integer.MAX_VALUE;
        if (t.getDueDate() != null) {
            LocalDateTime nowLdt = LocalDateTime.now(ctx.zoneId());
            if (t.getDueDate().isBefore(nowLdt)) {
                availableToDue = 0;
            } else {
                LocalDate dueLocalDate = t.getDueDate().toLocalDate();
                if (dueLocalDate.isBefore(ctx.startDate())) {
                    availableToDue = 0;
                } else if (cumulativeFreeTimeMap.containsKey(dueLocalDate)) {
                    int prevTotal = 0;
                    if (!dueLocalDate.equals(ctx.startDate())) {
                        prevTotal = cumulativeFreeTimeMap.getOrDefault(dueLocalDate.minusDays(1), 0);
                    }
                    
                    int startMin = dueLocalDate.equals(ctx.startDate()) ? nowLdt.getHour() * 60 + nowLdt.getMinute() : 0;
                    int dueMin = t.getDueDate().getHour() * 60 + t.getDueDate().getMinute();
                    
                    if (dueMin <= startMin) {
                        availableToDue = prevTotal;
                    } else {
                        int freeOnDueDate = 0;
                        List<InMemoryBitmapScheduler.ScheduleGap> gaps = bitmapScheduler.findFreeGaps(ctx.userId(), dueLocalDate, startMin, dueMin, 1);
                        for (InMemoryBitmapScheduler.ScheduleGap gap : gaps) {
                            freeOnDueDate += gap.durationMin();
                        }
                        availableToDue = prevTotal + freeOnDueDate;
                    }
                } else {
                    availableToDue = totalFreeSoFar + 1440;
                }
            }
        }
        return availableToDue - rem;
    }
}
