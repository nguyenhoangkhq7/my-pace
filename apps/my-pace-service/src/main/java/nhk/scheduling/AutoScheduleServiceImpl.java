package nhk.scheduling;

import lombok.RequiredArgsConstructor;
import nhk.calendar.FixedEventResponse;
import nhk.calendar.FixedEventService;
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
import nhk.timeblock.TaskTimeBlockDto;
import nhk.timeblock.TaskTimeBlockRepository;
import nhk.timecontext.TimeContext;
import nhk.timecontext.TimeContextSlot;
import nhk.user.User;
import nhk.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AutoScheduleServiceImpl implements AutoScheduleService {

    private final UserRepository userRepo;
    private final TaskRepository taskRepository;
    private final DailyPlanRepository dailyPlanRepository;
    private final TaskTimeBlockRepository timeBlockRepository;
    private final FixedEventService eventService;
    private final InMemoryBitmapScheduler bitmapScheduler;
    private final GoalRepository goalRepository;
    private final CategoryRepository categoryRepository;
    private final DailyPlanTaskRepository dailyPlanTaskRepository;

    private final ConcurrentHashMap<UUID, ReentrantLock> userLocks = new ConcurrentHashMap<>();

    private static class TaskQueueItem {
        Task task;
        int remainingMinutes;
        int partsFilled = 0;
        int existingPartsCount = 0;
        int priorityRank;
        double riskScore;
        LocalTime preferTime;

        TaskQueueItem(Task task, int remainingMinutes, int existingPartsCount, int priorityRank, double riskScore, LocalTime preferTime) {
            this.task = task;
            this.remainingMinutes = remainingMinutes;
            this.existingPartsCount = existingPartsCount;
            this.priorityRank = priorityRank;
            this.riskScore = riskScore;
            this.preferTime = preferTime;
        }
    }

    private record ScheduleContext(
            UUID userId,
            User user,
            ZoneId zoneId,
            LocalDate startDate,
            LocalDate endDate,
            List<LocalDate> dateRange,
            int bufferMinutes,
            boolean singleDayOnly,
            int wakeMin,
            int sleepMin,
            Map<UUID, Goal> goalMap,
            Map<UUID, Category> categoryMap,
            Map<LocalDate, DailyPlan> planMap,
            Map<LocalDate, List<TaskTimeBlock>> blocksByDate,
            Map<UUID, List<DailyPlanTask>> planTasksByPlanId
    ) {}

    private record TaskQueueResult(
            Map<LocalDate, List<TaskQueueItem>> dateTaskQueues,
            List<TaskQueueItem> backlogQueue,
            Map<LocalDate, Set<UUID>> pickedTaskIdsPerDate,
            Set<LocalDate> datesWithDailyPlan,
            Map<UUID, Task> userTaskMap
    ) {}

    @Override
    @Transactional
    public AutoScheduleResponse autoScheduleWeek(UUID userId, LocalDate startDateInput, Integer bufferMinutesInput, Boolean singleDayOnlyInput) {
        ReentrantLock lock = userLocks.computeIfAbsent(userId, k -> new ReentrantLock());
        if (!lock.tryLock()) {
            throw new IllegalStateException("Auto-schedule is already in progress for user: " + userId);
        }

        try {
            return doAutoScheduleWeek(userId, startDateInput, bufferMinutesInput, singleDayOnlyInput);
        } finally {
            lock.unlock();
        }
    }

    private AutoScheduleResponse doAutoScheduleWeek(UUID userId, LocalDate startDateInput, Integer bufferMinutesInput, Boolean singleDayOnlyInput) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        ZoneId zoneId = ZoneId.of(user.getTimezone() != null && !user.getTimezone().isBlank() ? user.getTimezone() : "UTC");
        LocalDate today = LocalDate.now(zoneId);
        LocalDate startDate = startDateInput != null ? startDateInput : today;

        int bufferMinutes = bufferMinutesInput != null && bufferMinutesInput >= 0 ? bufferMinutesInput : 10;
        boolean singleDayOnly = Boolean.TRUE.equals(singleDayOnlyInput);

        LocalDate endDate;
        if (singleDayOnly) {
            endDate = startDate;
        } else {
            LocalDate endOfFirstWeek = startDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
            endDate = endOfFirstWeek.plusWeeks(1);
        }

        LocalTime wakeTime = user.getWakeTime() != null ? user.getWakeTime() : LocalTime.of(7, 0);
        LocalTime sleepTime = user.getSleepTime() != null ? user.getSleepTime() : LocalTime.of(23, 0);

        int wakeMin = wakeTime.getHour() * 60 + wakeTime.getMinute();
        int sleepMin = sleepTime.getHour() * 60 + sleepTime.getMinute();

        Map<UUID, Goal> goalMap = goalRepository.findByUserId(userId)
                .stream().collect(Collectors.toMap(Goal::getId, g -> g, (a, b) -> a));

        Map<UUID, Category> categoryMap = categoryRepository.findByUserIdWithTimeContext(userId)
                .stream().collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a));

        List<LocalDate> dateRange = new ArrayList<>();
        LocalDate curr = startDate;
        while (!curr.isAfter(endDate)) {
            dateRange.add(curr);
            curr = curr.plusDays(1);
        }

        List<DailyPlan> plansInRange = dailyPlanRepository.findByUserIdAndPlanDateBetweenOrderByPlanDateAsc(userId, startDate, endDate);
        Map<LocalDate, DailyPlan> planMap = plansInRange.stream().collect(Collectors.toMap(DailyPlan::getPlanDate, p -> p));

        List<UUID> planIds = plansInRange.stream().map(DailyPlan::getId).collect(Collectors.toList());

        Map<LocalDate, List<TaskTimeBlock>> blocksByDate;
        Map<UUID, List<DailyPlanTask>> planTasksByPlanId = new HashMap<>();

        List<TaskTimeBlock> allBlocksInRange = timeBlockRepository.findByUserIdAndDateRange(userId, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay().minusNanos(1));
        blocksByDate = allBlocksInRange.stream().collect(Collectors.groupingBy(b -> b.getStartTime().toLocalDate()));

        if (!planIds.isEmpty()) {

            List<DailyPlanTask> allPlanTasksInRange = dailyPlanTaskRepository.findByDailyPlanIdIn(planIds);
            planTasksByPlanId = allPlanTasksInRange.stream().collect(Collectors.groupingBy(DailyPlanTask::getDailyPlanId));
        }

        ScheduleContext ctx = new ScheduleContext(
                userId, user, zoneId, startDate, endDate, dateRange, bufferMinutes, singleDayOnly,
                wakeMin, sleepMin, goalMap, categoryMap, planMap, blocksByDate, planTasksByPlanId
        );

        // 1. Prepare in-memory bitmaps for each date in horizon and populate fixed events / sleep window
        prepareBitmaps(ctx);

        // 2. Build task queues (date-specific & backlog) and sort
        TaskQueueResult queueResult = buildTaskQueues(ctx);

        // 3. Schedule blocks across dateRange
        Set<LocalDate> datesActuallyProcessed = new HashSet<>();
        Map<LocalDate, List<TaskTimeBlock>> generatedBlocksPerDate = scheduleBlocksForDate(
                ctx, queueResult, datesActuallyProcessed, today
        );

        // 4. Post-processing: Persist DailyPlans & TaskTimeBlocks to PostgreSQL and reconcile
        return persistAndReconcile(ctx, queueResult, generatedBlocksPerDate, datesActuallyProcessed);
    }

    private void prepareBitmaps(ScheduleContext ctx) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    if (status == STATUS_ROLLED_BACK) {
                        for (LocalDate date : ctx.dateRange()) {
                            bitmapScheduler.clearSchedule(ctx.userId(), date);
                        }
                    }
                }
            });
        }

        for (LocalDate date : ctx.dateRange()) {
            bitmapScheduler.clearSchedule(ctx.userId(), date);
            bitmapScheduler.markRangeBusy(ctx.userId(), date, 0, ctx.wakeMin());
            bitmapScheduler.markRangeBusy(ctx.userId(), date, ctx.sleepMin(), 1440);
        }

        // 1.1 Mark fixed events busy in bitmap
        List<FixedEventResponse> fixedEvents = eventService.getEventsInRange(ctx.userId(), ctx.startDate(), ctx.endDate());
        for (FixedEventResponse ev : fixedEvents) {
            LocalDate evDate = ev.occurrenceDate();
            if (evDate == null || !ctx.dateRange().contains(evDate)) continue;
            
            // Skip FREE events — tasks can overlay on their time slots
            if ("FREE".equalsIgnoreCase(ev.availabilityStatus())) continue;

            if (Boolean.TRUE.equals(ev.isAllDay())) {
                bitmapScheduler.markRangeBusy(ctx.userId(), evDate, 0, 1440);
            } else if (ev.startTime() != null && ev.endTime() != null) {
                int sMin = ev.startTime().getHour() * 60 + ev.startTime().getMinute();
                int eMin = ev.endTime().getHour() * 60 + ev.endTime().getMinute();
                if (eMin <= sMin) eMin = 1440;
                bitmapScheduler.markRangeBusy(ctx.userId(), evDate, sMin, eMin + ctx.bufferMinutes());
            }
        }

        // Mark existing BUSY/confirmed blocks busy in bitmap
        for (LocalDate date : ctx.dateRange()) {
            DailyPlan plan = ctx.planMap().get(date);
            if (plan != null) {
                List<TaskTimeBlock> existingBlocks = ctx.blocksByDate().getOrDefault(date, new ArrayList<>());
                for (TaskTimeBlock tb : existingBlocks) {
                    if (Boolean.TRUE.equals(plan.getIsConfirmed()) || "BUSY".equalsIgnoreCase(tb.getAvailabilityStatus()) || Boolean.TRUE.equals(tb.getIsLocked())) {
                        int sMin = tb.getStartTime().getHour() * 60 + tb.getStartTime().getMinute();
                        int eMin = tb.getEndTime().getHour() * 60 + tb.getEndTime().getMinute();
                        if (eMin <= sMin) eMin = 1440;
                        bitmapScheduler.markRangeBusy(ctx.userId(), date, sMin, eMin + ctx.bufferMinutes());
                    }
                }
            }
        }
    }

    private TaskQueueResult buildTaskQueues(ScheduleContext ctx) {
        Map<LocalDate, Set<UUID>> pickedTaskIdsPerDate = new HashMap<>();
        Set<LocalDate> datesWithDailyPlan = new HashSet<>();

        for (LocalDate d : ctx.dateRange()) {
            DailyPlan dp = ctx.planMap().get(d);
            if (dp != null) {
                Set<UUID> taskIdsForDate = new HashSet<>();
                List<DailyPlanTask> dpts = ctx.planTasksByPlanId().getOrDefault(dp.getId(), Collections.emptyList());
                dpts.forEach(dpt -> taskIdsForDate.add(dpt.getTask().getId()));

                if (!taskIdsForDate.isEmpty()) {
                    pickedTaskIdsPerDate.put(d, taskIdsForDate);
                    datesWithDailyPlan.add(d);
                } else if (Boolean.TRUE.equals(dp.getIsConfirmed())) {
                    datesWithDailyPlan.add(d);
                }
            }
        }

        List<Task> allUserTasks = taskRepository.findByUserId(ctx.userId());
        Map<UUID, Task> userTaskMap = allUserTasks.stream().collect(Collectors.toMap(Task::getId, t -> t, (a, b) -> a));
        Map<LocalDate, List<TaskQueueItem>> dateTaskQueues = new HashMap<>();
        List<TaskQueueItem> backlogQueue = new ArrayList<>();

        List<UUID> taskIds = allUserTasks.stream().map(Task::getId).collect(Collectors.toList());
        Map<UUID, List<TaskTimeBlock>> blocksByTaskId = new HashMap<>();
        if (!taskIds.isEmpty()) {
            List<TaskTimeBlock> allTaskBlocks = timeBlockRepository.findByTaskIdIn(taskIds);
            blocksByTaskId = allTaskBlocks.stream().collect(Collectors.groupingBy(TaskTimeBlock::getTaskId));
        }

        // 3.2 Cache free minutes calculation per due date
        Map<LocalDate, Integer> freeMinutesCache = new HashMap<>();

        for (Task t : allUserTasks) {
            if ("Done".equalsIgnoreCase(t.getStatus())) continue;
            if (t.getEstimatedMinutes() == null || t.getEstimatedMinutes() <= 0) continue;
            int est = t.getEstimatedMinutes();
            int act = t.getActualMinutes() != null ? t.getActualMinutes() : 0;

            List<TaskTimeBlock> existingTaskBlocks = blocksByTaskId.getOrDefault(t.getId(), new ArrayList<>());

            int busyMinutes = existingTaskBlocks.stream()
                    .filter(b -> "BUSY".equalsIgnoreCase(b.getAvailabilityStatus()))
                    .filter(b -> !b.getStartTime().toLocalDate().isBefore(ctx.startDate()))
                    .mapToInt(b -> (int) java.time.Duration.between(b.getStartTime(), b.getEndTime()).toMinutes())
                    .sum();

            int existingPartsCount = (int) existingTaskBlocks.stream()
                    .filter(b -> "BUSY".equalsIgnoreCase(b.getAvailabilityStatus()))
                    .filter(b -> !b.getStartTime().toLocalDate().isBefore(ctx.startDate()))
                    .count();

            int rem = est - act - busyMinutes;
            if (rem <= 0) continue;

            LocalTime preferTime = null;
            if (t.getGoalId() != null && ctx.goalMap().containsKey(t.getGoalId())) {
                preferTime = ctx.goalMap().get(t.getGoalId()).getPreferTime();
            }

            LocalDate dueLocalDate = t.getDueDate() != null ? t.getDueDate().toLocalDate() : ctx.endDate();
            if (dueLocalDate.isBefore(ctx.startDate())) dueLocalDate = ctx.startDate();

            int availableFreeMinutes = freeMinutesCache.computeIfAbsent(dueLocalDate, d ->
                    calculateFreeMinutesInRange(ctx.userId(), ctx.startDate(), d, ctx.wakeMin(), ctx.sleepMin())
            );
            double riskScore = availableFreeMinutes > 0 ? ((double) rem / availableFreeMinutes) : 1.0;

            boolean isUrgent = Boolean.TRUE.equals(t.getIsUrgent());
            boolean isImportant = Boolean.TRUE.equals(t.getIsImportant());

            int priorityRank;
            if (isUrgent && isImportant) {
                priorityRank = 0; // Q1
            } else if (!isUrgent && isImportant) {
                priorityRank = 1; // Q2
            } else if (isUrgent && !isImportant) {
                priorityRank = 2; // Q3
            } else {
                priorityRank = 3; // Q4
            }

            TaskQueueItem item = new TaskQueueItem(t, rem, existingPartsCount, priorityRank, riskScore, preferTime);

            LocalDate pickedDate = null;
            for (LocalDate d : ctx.dateRange()) {
                Set<UUID> picked = pickedTaskIdsPerDate.get(d);
                if (picked != null && picked.contains(t.getId())) {
                    pickedDate = d;
                    break;
                }
            }

            if (pickedDate != null) {
                dateTaskQueues.computeIfAbsent(pickedDate, k -> new ArrayList<>()).add(item);
            } else {
                backlogQueue.add(item);
            }
        }

        Comparator<TaskQueueItem> queueComparator = (a, b) -> {
            if (a.priorityRank != b.priorityRank) return Integer.compare(a.priorityRank, b.priorityRank);
            if (Double.compare(b.riskScore, a.riskScore) != 0) return Double.compare(b.riskScore, a.riskScore);
            if (a.preferTime != null && b.preferTime == null) return -1;
            if (a.preferTime == null && b.preferTime != null) return 1;
            LocalDateTime aDue = a.task.getDueDate();
            LocalDateTime bDue = b.task.getDueDate();
            if (aDue != null && bDue != null && !aDue.equals(bDue)) {
                return aDue.compareTo(bDue);
            } else if (aDue != null && bDue == null) {
                return -1;
            } else if (aDue == null && bDue != null) {
                return 1;
            }
            return Integer.compare(b.remainingMinutes, a.remainingMinutes);
        };

        for (List<TaskQueueItem> queue : dateTaskQueues.values()) {
            queue.sort(queueComparator);
        }
        backlogQueue.sort(queueComparator);

        return new TaskQueueResult(dateTaskQueues, backlogQueue, pickedTaskIdsPerDate, datesWithDailyPlan, userTaskMap);
    }

    private Map<LocalDate, List<TaskTimeBlock>> scheduleBlocksForDate(
            ScheduleContext ctx, TaskQueueResult queues, Set<LocalDate> datesActuallyProcessed, LocalDate today
    ) {
        Map<LocalDate, List<TaskTimeBlock>> generatedBlocksPerDate = new LinkedHashMap<>();
        for (LocalDate d : ctx.dateRange()) {
            generatedBlocksPerDate.put(d, new ArrayList<>());
        }

        LocalTime currentTime = LocalTime.now(ctx.zoneId());

        for (LocalDate date : ctx.dateRange()) {
            DailyPlan planOfDate = ctx.planMap().get(date);
            if (planOfDate != null && Boolean.TRUE.equals(planOfDate.getIsConfirmed())) {
                continue;
            }
            List<TaskQueueItem> activeQueue;
            if (queues.datesWithDailyPlan().contains(date)) {
                List<TaskQueueItem> dateQueue = queues.dateTaskQueues().get(date);
                if (dateQueue == null || dateQueue.isEmpty()) {
                    continue;
                }
                activeQueue = new ArrayList<>(dateQueue);
            } else {
                if (queues.backlogQueue().isEmpty()) {
                    continue;
                }
                activeQueue = new ArrayList<>(queues.backlogQueue());
            }

            if (activeQueue.isEmpty()) continue;

            Map<UUID, Integer> dailyScheduledMinutes = new HashMap<>();
            DailyPlan plan = ctx.planMap().get(date);
            if (plan != null) {
                List<TaskTimeBlock> existingBlocks = ctx.blocksByDate().getOrDefault(date, new ArrayList<>());
                for (TaskTimeBlock tb : existingBlocks) {
                    if ("BUSY".equalsIgnoreCase(tb.getAvailabilityStatus())) {
                        int dur = (int) Duration.between(tb.getStartTime(), tb.getEndTime()).toMinutes();
                        dailyScheduledMinutes.merge(tb.getTaskId(), dur, Integer::sum);
                    }
                }
            }

            int windowStartMin;
            if (date.equals(today)) {
                int nowMin = currentTime.getHour() * 60 + currentTime.getMinute();
                int baseMin = Math.max(ctx.wakeMin(), nowMin + 5);
                windowStartMin = ((baseMin + 14) / 15) * 15;
            } else {
                windowStartMin = ctx.wakeMin() + 15;
            }

            int windowEndMin = ctx.sleepMin();
            if (windowStartMin >= windowEndMin) continue;

            datesActuallyProcessed.add(date);
            int minChunkLimit = 15;

            List<InMemoryBitmapScheduler.ScheduleGap> gaps = bitmapScheduler.findFreeGaps(ctx.userId(), date, windowStartMin, windowEndMin, minChunkLimit);

            while (true) {
                if (activeQueue.isEmpty()) break;

                final int limit = minChunkLimit;
                gaps = gaps.stream().filter(g -> g.durationMin() >= limit).collect(Collectors.toList());

                if (gaps.isEmpty()) {
                    gaps = bitmapScheduler.findFreeGaps(ctx.userId(), date, windowStartMin, windowEndMin, minChunkLimit);
                    if (gaps.isEmpty()) break;
                }

                boolean scheduledAnyInPass = false;

                for (InMemoryBitmapScheduler.ScheduleGap gap : gaps) {
                    int itemIndex = 0;

                    while (itemIndex < activeQueue.size()) {
                        TaskQueueItem item = activeQueue.get(itemIndex);

                        // 1.2 Enforce due date constraint — do not schedule task past its due date
                        LocalDateTime due = item.task.getDueDate();
                        if (due != null && date.isAfter(due.toLocalDate())) {
                            itemIndex++;
                            continue;
                        }

                        int gapRemaining = gap.durationMin();

                        boolean isSplittable = !Boolean.FALSE.equals(item.task.getIsSplittable());
                        int scheduledToday = dailyScheduledMinutes.getOrDefault(item.task.getId(), 0);
                        int maxDailyCap = item.task.getMaxDailyDuration() != null && item.task.getMaxDailyDuration() >= 15
                                ? item.task.getMaxDailyDuration() : 1440;
                        int remainingDailyCap = maxDailyCap - scheduledToday;

                        int chunkSize;

                        if (!isSplittable) {
                            if (item.partsFilled + item.existingPartsCount > 0 || gapRemaining < item.remainingMinutes || (item.task.getMaxDailyDuration() != null && scheduledToday + item.remainingMinutes > item.task.getMaxDailyDuration())) {
                                itemIndex++;
                                continue;
                            }
                            chunkSize = item.remainingMinutes;
                        } else {
                            int minChunk = item.task.getMinChunkMinutes() != null && item.task.getMinChunkMinutes() >= 15
                                    ? item.task.getMinChunkMinutes() : 30;

                            if (remainingDailyCap < minChunk || gapRemaining < minChunk) {
                                itemIndex++;
                                continue;
                            }

                            int maxChunk = Math.min(120, Math.min(maxDailyCap, remainingDailyCap));
                            int targetChunk = Math.min(item.remainingMinutes, Math.min(gapRemaining, maxChunk));

                            int remainingAfter = item.remainingMinutes - targetChunk;
                            if (remainingAfter > 0 && remainingAfter < minChunk) {
                                int adjustedChunk = item.remainingMinutes - minChunk;
                                adjustedChunk = (adjustedChunk / 15) * 15;
                                if (adjustedChunk >= minChunk && adjustedChunk <= gapRemaining && adjustedChunk <= maxChunk) {
                                    targetChunk = adjustedChunk;
                                    remainingAfter = item.remainingMinutes - targetChunk;
                                } else {
                                    if (item.remainingMinutes <= gapRemaining && item.remainingMinutes <= maxChunk) {
                                        targetChunk = item.remainingMinutes;
                                    } else {
                                        itemIndex++;
                                        continue;
                                    }
                                }
                            }

                            if (item.remainingMinutes > maxChunk && targetChunk == maxChunk && remainingAfter >= minChunk) {
                                int numParts = (int) Math.ceil((double) item.remainingMinutes / maxChunk);
                                if (numParts > 1) {
                                    int idealChunk = ((item.remainingMinutes / numParts + 7) / 15) * 15;
                                    if (idealChunk >= minChunk && idealChunk <= gapRemaining && idealChunk <= maxChunk
                                            && (item.remainingMinutes - idealChunk) >= minChunk) {
                                        targetChunk = idealChunk;
                                    }
                                }
                            }

                            chunkSize = targetChunk;

                            if (chunkSize < minChunk) {
                                int totalEst = item.task.getEstimatedMinutes() != null ? item.task.getEstimatedMinutes() : item.remainingMinutes;
                                if (totalEst < minChunk && gapRemaining >= item.remainingMinutes && remainingDailyCap >= item.remainingMinutes) {
                                    chunkSize = item.remainingMinutes;
                                } else {
                                    itemIndex++;
                                    continue;
                                }
                            }
                        }

                        int bestStartMin = findBestCandidateStart(
                                date, gap.startMin(), gap.endMin(), chunkSize,
                                item.preferTime, item.task.getCategoryId(), ctx.categoryMap()
                        );

                        int blockStartMin = bestStartMin;
                        int blockEndMin = blockStartMin + chunkSize;

                        LocalDateTime blockStartLdt = date.atStartOfDay().plusMinutes(blockStartMin);
                        LocalDateTime blockEndLdt = date.atStartOfDay().plusMinutes(blockEndMin);

                        item.partsFilled++;

                        TaskTimeBlock block = new TaskTimeBlock();
                        block.setTaskId(item.task.getId());
                        block.setStartTime(blockStartLdt);
                        block.setEndTime(blockEndLdt);
                        block.setPartIndex(item.partsFilled);
                        block.setTotalParts(item.partsFilled);
                        block.setAvailabilityStatus("FREE");

                        generatedBlocksPerDate.get(date).add(block);

                        bitmapScheduler.markRangeBusy(ctx.userId(), date, blockStartMin, blockEndMin + ctx.bufferMinutes());
                        gaps = subtractBusyRange(gaps, blockStartMin, blockEndMin + ctx.bufferMinutes());

                        item.remainingMinutes -= chunkSize;
                        dailyScheduledMinutes.put(item.task.getId(), scheduledToday + chunkSize);

                        if (item.remainingMinutes <= 0) {
                            activeQueue.remove(item);
                            queues.dateTaskQueues().values().forEach(q -> q.remove(item));
                            queues.backlogQueue().remove(item);
                        }

                        scheduledAnyInPass = true;
                        break;
                    }

                    if (scheduledAnyInPass) break;
                }

                if (!scheduledAnyInPass) break;
            }
        }

        return generatedBlocksPerDate;
    }

    private AutoScheduleResponse persistAndReconcile(
            ScheduleContext ctx, TaskQueueResult queues,
            Map<LocalDate, List<TaskTimeBlock>> generatedBlocksPerDate, Set<LocalDate> datesActuallyProcessed
    ) {
        Map<LocalDate, List<TaskTimeBlockDto>> responseMap = new LinkedHashMap<>();

        for (Map.Entry<LocalDate, List<TaskTimeBlock>> entry : generatedBlocksPerDate.entrySet()) {
            LocalDate date = entry.getKey();
            List<TaskTimeBlock> rawBlocks = entry.getValue();

            // 2.2 Avoid creating empty DailyPlan records for dates with 0 blocks if no plan existed before
            DailyPlan existingPlan = ctx.planMap().get(date);
            if (existingPlan == null && rawBlocks.isEmpty()) {
                continue;
            }

            DailyPlan plan = existingPlan;
            if (plan == null) {
                DailyPlan p = new DailyPlan();
                p.setUserId(ctx.userId());
                p.setPlanDate(date);
                p.setAvailableMinutes(0);
                p.setIsConfirmed(false);
                p.setIsReviewed(false);
                plan = dailyPlanRepository.save(p);
                ctx.planMap().put(date, plan);
            }

            if (!Boolean.TRUE.equals(plan.getIsConfirmed()) && datesActuallyProcessed.contains(date)) {
                java.time.LocalDateTime start = date.atStartOfDay();
                java.time.LocalDateTime end = date.plusDays(1).atStartOfDay().minusNanos(1);
                List<TaskTimeBlock> allExistingBlocks = timeBlockRepository.findByUserIdAndDateRange(ctx.userId(), start, end);

                List<TaskTimeBlock> existingBusyBlocks = allExistingBlocks.stream()
                        .filter(b -> "BUSY".equalsIgnoreCase(b.getAvailabilityStatus()))
                        .collect(Collectors.toList());

                List<TaskTimeBlock> existingFreeBlocks = allExistingBlocks.stream()
                        .filter(b -> !"BUSY".equalsIgnoreCase(b.getAvailabilityStatus()))
                        .collect(Collectors.toList());

                Map<String, TaskTimeBlock> existingFreeMap = new HashMap<>();
                for (TaskTimeBlock b : existingFreeBlocks) {
                    int pIndex = b.getPartIndex() != null ? b.getPartIndex() : 1;
                    existingFreeMap.put(b.getTaskId() + "_" + pIndex, b);
                }

                List<TaskTimeBlock> blocksToSave = new ArrayList<>();
                List<TaskTimeBlock> finalFreeBlocks = new ArrayList<>();
                Set<UUID> matchedExistingIds = new HashSet<>();

                for (TaskTimeBlock raw : rawBlocks) {
                    int pIndex = raw.getPartIndex() != null ? raw.getPartIndex() : 1;
                    String key = raw.getTaskId() + "_" + pIndex;
                    TaskTimeBlock existing = existingFreeMap.get(key);

                    if (existing != null) {
                        matchedExistingIds.add(existing.getId());
                        if (!existing.getStartTime().equals(raw.getStartTime()) || !existing.getEndTime().equals(raw.getEndTime())) {
                            existing.setStartTime(raw.getStartTime());
                            existing.setEndTime(raw.getEndTime());
                            existing.setPartIndex(raw.getPartIndex());
                            blocksToSave.add(existing);
                        }
                        finalFreeBlocks.add(existing);
                    } else {
                        blocksToSave.add(raw);
                        finalFreeBlocks.add(raw);
                    }
                }

                List<TaskTimeBlock> blocksToDelete = existingFreeBlocks.stream()
                        .filter(b -> !matchedExistingIds.contains(b.getId()))
                        .collect(Collectors.toList());

                if (!blocksToDelete.isEmpty()) {
                    timeBlockRepository.deleteAll(blocksToDelete);
                }
                if (!blocksToSave.isEmpty()) {
                    List<TaskTimeBlock> savedResult = timeBlockRepository.saveAll(blocksToSave);
                    Map<String, TaskTimeBlock> savedMap = savedResult.stream()
                            .collect(Collectors.toMap(
                                    b -> b.getTaskId() + "_" + (b.getPartIndex() != null ? b.getPartIndex() : 1),
                                    b -> b,
                                    (a, b) -> a
                            ));
                    for (int i = 0; i < finalFreeBlocks.size(); i++) {
                        TaskTimeBlock f = finalFreeBlocks.get(i);
                        String key = f.getTaskId() + "_" + (f.getPartIndex() != null ? f.getPartIndex() : 1);
                        if (savedMap.containsKey(key)) {
                            finalFreeBlocks.set(i, savedMap.get(key));
                        }
                    }
                }

                // 2.3 Use cached planTasksByPlanId map to avoid N+1 queries
                List<DailyPlanTask> existingPlanTasks = ctx.planTasksByPlanId().getOrDefault(plan.getId(), Collections.emptyList());
                Set<UUID> existingTaskIdsInPlan = existingPlanTasks.stream()
                        .map(dpt -> dpt.getTask().getId())
                        .collect(Collectors.toSet());

                int nextSortOrder = existingPlanTasks.stream()
                        .mapToInt(dpt -> dpt.getSortOrder() != null ? dpt.getSortOrder() : 0)
                        .max().orElse(0) + 1;

                if (queues.datesWithDailyPlan().contains(date)) {
                    List<DailyPlanTask> newPlanTasksToSave = new ArrayList<>();
                    for (TaskTimeBlock b : finalFreeBlocks) {
                        if (!existingTaskIdsInPlan.contains(b.getTaskId())) {
                            Task task = queues.userTaskMap().get(b.getTaskId());
                            if (task != null) {
                                DailyPlanTask dpt = new DailyPlanTask();
                                dpt.setDailyPlanId(plan.getId());
                                dpt.setTask(task);
                                dpt.setIsMit(false);
                                dpt.setSortOrder(nextSortOrder++);
                                newPlanTasksToSave.add(dpt);
                                existingTaskIdsInPlan.add(b.getTaskId());
                            }
                        }
                    }
                    if (!newPlanTasksToSave.isEmpty()) {
                        dailyPlanTaskRepository.saveAll(newPlanTasksToSave);
                    }
                }

                List<TaskTimeBlock> allBlocks = new ArrayList<>(existingBusyBlocks);
                allBlocks.addAll(finalFreeBlocks);
                allBlocks.sort(Comparator.comparing(TaskTimeBlock::getStartTime));

                Set<UUID> validTaskIds = allBlocks.stream()
                        .map(TaskTimeBlock::getTaskId)
                        .collect(Collectors.toSet());

                for (DailyPlanTask dpt : existingPlanTasks) {
                    Task t = queues.userTaskMap().get(dpt.getTask().getId());
                    if (t != null && "Done".equalsIgnoreCase(t.getStatus())) {
                        validTaskIds.add(t.getId());
                    }
                }

                // NOTE: We intentionally do NOT remove orphaned tasks from the plan.
                // When there is no available slot for a task, it stays in the daily plan as
                // "unscheduled" (no time block). The user can then decide what to do with it
                // via the UI (e.g. drag to calendar or move back to Backlog via OverscheduledModal).
                // Automatically removing tasks without user consent is bad UX.

                Map<UUID, Integer> taskMaxParts = new HashMap<>();
                for (TaskTimeBlock b : allBlocks) {
                    taskMaxParts.put(b.getTaskId(), Math.max(taskMaxParts.getOrDefault(b.getTaskId(), 0), b.getPartIndex()));
                }
                for (TaskTimeBlock b : allBlocks) {
                    b.setTotalParts(taskMaxParts.get(b.getTaskId()));
                }

                List<TaskTimeBlockDto> dtos = allBlocks.stream()
                        .map(b -> new TaskTimeBlockDto(
                                b.getId(), b.getTaskId(),
                                b.getStartTime(), b.getEndTime(),
                                b.getPartIndex(), b.getTotalParts(),
                                b.getActualMinutes() != null ? b.getActualMinutes() : 0,
                                b.getIsCompleted() != null ? b.getIsCompleted() : false,
                                b.getCompletedAt(),
                                b.getAvailabilityStatus() != null ? b.getAvailabilityStatus() : "FREE",
                                Boolean.TRUE.equals(b.getIsLocked())
                        ))
                        .collect(Collectors.toList());
                responseMap.put(date, dtos);
            } else {
                // 3.4 Plan is confirmed OR date was not processed in this pass
                java.time.LocalDateTime start = date.atStartOfDay();
                java.time.LocalDateTime end = date.plusDays(1).atStartOfDay().minusNanos(1);
                List<TaskTimeBlockDto> existingDtos = timeBlockRepository.findByUserIdAndDateRange(ctx.userId(), start, end)
                        .stream()
                        .map(b -> new TaskTimeBlockDto(
                                b.getId(), b.getTaskId(),
                                b.getStartTime(), b.getEndTime(),
                                b.getPartIndex(), b.getTotalParts(),
                                b.getActualMinutes() != null ? b.getActualMinutes() : 0,
                                b.getIsCompleted() != null ? b.getIsCompleted() : false,
                                b.getCompletedAt(),
                                b.getAvailabilityStatus() != null ? b.getAvailabilityStatus() : "FREE",
                                Boolean.TRUE.equals(b.getIsLocked())
                        ))
                        .collect(Collectors.toList());
                responseMap.put(date, existingDtos);
            }
        }

        int overflowMinutes = 0;
        for (List<TaskQueueItem> queue : queues.dateTaskQueues().values()) {
            overflowMinutes += queue.stream()
                    .mapToInt(item -> item.remainingMinutes)
            .sum();
        }
        boolean scheduledBacklog = false;
        for (LocalDate d : ctx.dateRange()) {
            if (!queues.datesWithDailyPlan().contains(d)) {
                scheduledBacklog = true;
                break;
            }
        }

        if (scheduledBacklog) {
            overflowMinutes += queues.backlogQueue().stream()
                    .mapToInt(item -> item.remainingMinutes)
                    .sum();
        }
        boolean isOverscheduled = overflowMinutes > 0;

        return new AutoScheduleResponse(ctx.startDate(), ctx.endDate(), responseMap, overflowMinutes, isOverscheduled);
    }

    private int findBestCandidateStart(
            LocalDate date, int gapStartMin, int gapEndMin, int chunkSize,
            LocalTime preferTime, UUID categoryId, Map<UUID, Category> categoryMap
    ) {
        int maxCandidateEnd = gapEndMin - chunkSize;
        if (maxCandidateEnd <= gapStartMin) return gapStartMin;

        List<Integer> candidates = new ArrayList<>();
        candidates.add(gapStartMin);

        if (preferTime != null) {
            int pMin = preferTime.getHour() * 60 + preferTime.getMinute();
            if (pMin >= gapStartMin && pMin <= maxCandidateEnd) {
                candidates.add(pMin);
            }
        }

        if (categoryId != null && categoryMap.containsKey(categoryId)) {
            Category cat = categoryMap.get(categoryId);
            TimeContext tc = cat.getTimeContext();
            if (tc != null && tc.getSlots() != null) {
                DayOfWeek dow = date.getDayOfWeek();
                for (TimeContextSlot slot : tc.getSlots()) {
                    if (slot.getDayOfWeek() == dow) {
                        int sMin = slot.getStartTime().getHour() * 60 + slot.getStartTime().getMinute();
                        if (sMin >= gapStartMin && sMin <= maxCandidateEnd) {
                            candidates.add(sMin);
                        }
                    }
                }
            }
        }

        int bestStart = gapStartMin;
        double bestScore = -1.0;

        for (int cand : candidates) {
            double score = scoreCandidateSlot(date, cand, chunkSize, preferTime, categoryId, categoryMap);
            if (score > bestScore) {
                bestScore = score;
                bestStart = cand;
            }
        }

        return bestStart;
    }

    private double scoreCandidateSlot(
            LocalDate date, int startMin, int chunkSize,
            LocalTime preferTime, UUID categoryId, Map<UUID, Category> categoryMap
    ) {
        double preferScore = 1.0;
        if (preferTime != null) {
            int pMin = preferTime.getHour() * 60 + preferTime.getMinute();
            preferScore = Math.max(0.0, 1.0 - (Math.abs(startMin - pMin) / 480.0));
        }

        double contextScore = 1.0;
        if (categoryId != null && categoryMap.containsKey(categoryId)) {
            Category cat = categoryMap.get(categoryId);
            TimeContext tc = cat.getTimeContext();
            if (tc != null && tc.getSlots() != null && !tc.getSlots().isEmpty()) {
                DayOfWeek dow = date.getDayOfWeek();
                List<TimeContextSlot> daySlots = tc.getSlots().stream()
                        .filter(s -> s.getDayOfWeek() == dow)
                        .collect(Collectors.toList());

                if (!daySlots.isEmpty()) {
                    boolean fullyInside = false;
                    boolean partiallyInside = false;
                    int endMin = startMin + chunkSize;

                    for (TimeContextSlot slot : daySlots) {
                        int sMin = slot.getStartTime().getHour() * 60 + slot.getStartTime().getMinute();
                        int eMin = slot.getEndTime().getHour() * 60 + slot.getEndTime().getMinute();

                        if (startMin >= sMin && endMin <= eMin) {
                            fullyInside = true;
                            break;
                        } else if (startMin < eMin && endMin > sMin) {
                            partiallyInside = true;
                        }
                    }

                    if (fullyInside) contextScore = 1.0;
                    else if (partiallyInside) contextScore = 0.5;
                    else contextScore = 0.1;
                }
            }
        }

        return 0.5 * preferScore + 0.5 * contextScore;
    }

    private int calculateFreeMinutesInRange(UUID userId, LocalDate start, LocalDate end, int wakeMin, int sleepMin) {
        int totalFree = 0;
        LocalDate curr = start;

        while (!curr.isAfter(end)) {
            List<InMemoryBitmapScheduler.ScheduleGap> gaps = bitmapScheduler.findFreeGaps(userId, curr, wakeMin, sleepMin, 15);
            int dayFree = gaps.stream().mapToInt(InMemoryBitmapScheduler.ScheduleGap::durationMin).sum();
            totalFree += dayFree;
            curr = curr.plusDays(1);
        }
        return totalFree;
    }

    List<InMemoryBitmapScheduler.ScheduleGap> subtractBusyRange(List<InMemoryBitmapScheduler.ScheduleGap> gaps, int busyStart, int busyEnd) {
        if (gaps == null || gaps.isEmpty()) return new ArrayList<>();
        List<InMemoryBitmapScheduler.ScheduleGap> newGaps = new ArrayList<>();
        for (InMemoryBitmapScheduler.ScheduleGap gap : gaps) {
            if (busyEnd <= gap.startMin() || busyStart >= gap.endMin()) {
                newGaps.add(gap);
            } else {
                if (busyStart > gap.startMin()) {
                    int dur = busyStart - gap.startMin();
                    if (dur > 0) newGaps.add(new InMemoryBitmapScheduler.ScheduleGap(gap.startMin(), busyStart, dur));
                }
                if (busyEnd < gap.endMin()) {
                    int dur = gap.endMin() - busyEnd;
                    if (dur > 0) newGaps.add(new InMemoryBitmapScheduler.ScheduleGap(busyEnd, gap.endMin(), dur));
                }
            }
        }
        return newGaps;
    }
}
