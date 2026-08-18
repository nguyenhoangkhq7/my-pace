package nhk.scheduling;

import lombok.RequiredArgsConstructor;
import nhk.calendar.FixedEventResponse;
import nhk.calendar.FixedEventService;
import nhk.goal.Goal;
import nhk.planning.DailyPlan;
import nhk.timeblock.TaskTimeBlock;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

@Service
@RequiredArgsConstructor
public class AutoScheduleServiceImpl implements AutoScheduleService {

    private final AutoScheduleDataLoader dataLoader;
    private final TaskPriorityScorer priorityScorer;
    private final AutoSchedulePersister persister;
    private final FixedEventService eventService;
    private final InMemoryBitmapScheduler bitmapScheduler;

    private final ConcurrentHashMap<UUID, ReentrantLock> userLocks = new ConcurrentHashMap<>();

    @Override
    public AutoScheduleResponse autoSchedule(UUID userId, Integer bufferMinutesInput, boolean forceRescheduleToday) {
        ReentrantLock lock = userLocks.computeIfAbsent(userId, k -> new ReentrantLock());
        if (!lock.tryLock()) {
            throw new IllegalStateException("Auto-schedule is already in progress for user: " + userId);
        }
        try {
            return doAutoSchedule(userId, bufferMinutesInput, forceRescheduleToday);
        } finally {
            lock.unlock();
        }
    }

    private AutoScheduleResponse doAutoSchedule(UUID userId, Integer bufferMinutesInput, boolean forceRescheduleToday) {
        // 1. Data Loading Phase
        ScheduleContext ctx = dataLoader.loadContext(userId, bufferMinutesInput);

        // 2. Prepare Timetable (Bitmaps)
        prepareBitmaps(ctx);

        // 3. Scoring & Queuing Phase
        TaskQueueResult queueResult = priorityScorer.buildTaskQueues(ctx);

        // 4. Scheduling Engine (Linear Timeline Algorithm)
        Set<LocalDate> datesActuallyProcessed = new HashSet<>();
        Map<LocalDate, List<TaskTimeBlock>> generatedBlocksPerDate = scheduleBlocksForDate(
                ctx, queueResult, datesActuallyProcessed, forceRescheduleToday
        );

        // 5. Persistence Phase
        return persister.persistAndReconcile(ctx, queueResult, generatedBlocksPerDate, datesActuallyProcessed, forceRescheduleToday);
    }

    @Override
    public PreviewSlackResponse previewSlack(UUID userId, PreviewSlackRequest request, Integer bufferMinutesInput) {
        ReentrantLock lock = userLocks.computeIfAbsent(userId, k -> new ReentrantLock());
        lock.lock();
        try {
            ScheduleContext ctx = dataLoader.loadContext(userId, bufferMinutesInput);
            prepareBitmaps(ctx);
            Map<LocalDate, Integer> cumulativeFreeTimeMap = priorityScorer.calculateCumulativeFreeTimeMap(ctx);
            int totalFreeSoFar = cumulativeFreeTimeMap.values().stream().max(Integer::compareTo).orElse(0);

            nhk.task.Task mockTask = new nhk.task.Task();
            mockTask.setDueDate(request.dueDate() != null ? request.dueDate().atTime(23, 59) : null);
            
            int est = request.estimatedMinutes() != null ? request.estimatedMinutes() : 0;
            int act = request.actualMinutes() != null ? request.actualMinutes() : 0;
            int rem = Math.max(0, est - act);

            int trueSlackTime = priorityScorer.calculateTrueSlackTime(mockTask, ctx, cumulativeFreeTimeMap, totalFreeSoFar, rem);
            return new PreviewSlackResponse(trueSlackTime);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public BatchSlackResponse batchSlack(UUID userId, BatchSlackRequest request, Integer bufferMinutesInput) {
        ReentrantLock lock = userLocks.computeIfAbsent(userId, k -> new ReentrantLock());
        lock.lock();
        try {
            ScheduleContext ctx = dataLoader.loadContext(userId, bufferMinutesInput);
            prepareBitmaps(ctx);
            Map<LocalDate, Integer> cumulativeFreeTimeMap = priorityScorer.calculateCumulativeFreeTimeMap(ctx);
            int totalFreeSoFar = cumulativeFreeTimeMap.values().stream().max(Integer::compareTo).orElse(0);

            Map<UUID, Integer> slackTimes = new HashMap<>();
            Map<UUID, nhk.task.Task> taskMap = ctx.activeTasks().stream()
                    .collect(java.util.stream.Collectors.toMap(nhk.task.Task::getId, t -> t, (a, b) -> a));

            for (UUID taskId : request.taskIds()) {
                nhk.task.Task t = taskMap.get(taskId);
                if (t != null) {
                    int est = t.getEstimatedMinutes() != null ? t.getEstimatedMinutes() : 0;
                    int act = t.getActualMinutes() != null ? t.getActualMinutes() : 0;
                    
                    LocalDateTime nowLdt = LocalDateTime.now(ctx.zoneId());
                    List<TaskTimeBlock> existingTaskBlocks = ctx.taskTimeBlocksByTaskId().getOrDefault(t.getId(), Collections.emptyList());
                    int busyMinutes = 0;
                    for (TaskTimeBlock b : existingTaskBlocks) {
                        if ("BUSY".equalsIgnoreCase(b.getAvailabilityStatus()) && b.getEndTime().isAfter(nowLdt)) {
                            busyMinutes += (int) java.time.Duration.between(b.getStartTime(), b.getEndTime()).toMinutes();
                        }
                    }
                    int rem = Math.max(0, est - act - busyMinutes);

                    int trueSlackTime = priorityScorer.calculateTrueSlackTime(t, ctx, cumulativeFreeTimeMap, totalFreeSoFar, rem);
                    slackTimes.put(taskId, trueSlackTime);
                }
            }
            return new BatchSlackResponse(slackTimes);
        } finally {
            lock.unlock();
        }
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
        bitmapScheduler.cleanPastSchedules(ctx.userId(), ctx.startDate());

        for (LocalDate date : ctx.dateRange()) {
            bitmapScheduler.clearSchedule(ctx.userId(), date);
            if (ctx.sleepMin() < ctx.wakeMin()) {
                // Sleeps past midnight (e.g. sleep at 01:00, wake at 07:00)
                // Logical day extends until next day's sleep time.
                // The actual asleep period for the current day's cycle is from next day's 00:00 (which we map to 1440+)
                // Wait, if we mark 120 to 480 as busy on the NEXT day, we should just mark it on the next day.
                // The current calendar day is asleep from sleepMin to wakeMin.
                bitmapScheduler.markRangeBusy(ctx.userId(), date, ctx.sleepMin(), ctx.wakeMin());
            } else {
                // Normal schedule (e.g. wake at 07:00, sleep at 23:00)
                bitmapScheduler.markRangeBusy(ctx.userId(), date, 0, ctx.wakeMin());
                bitmapScheduler.markRangeBusy(ctx.userId(), date, ctx.sleepMin(), 1440);
            }
        }

        List<FixedEventResponse> fixedEvents = ctx.fixedEvents();
        for (FixedEventResponse ev : fixedEvents) {
            LocalDate evDate = ev.occurrenceDate();
            if (evDate == null || !ctx.dateRange().contains(evDate)) continue;
            if ("FREE".equalsIgnoreCase(ev.availabilityStatus())) continue;

            if (Boolean.TRUE.equals(ev.isAllDay())) {
                bitmapScheduler.markRangeBusy(ctx.userId(), evDate, 0, 1440);
            } else if (ev.startTime() != null && ev.endTime() != null) {
                int sMin = ev.startTime().getHour() * 60 + ev.startTime().getMinute();
                int eMin = ev.endTime().getHour() * 60 + ev.endTime().getMinute();
                if (eMin <= sMin) eMin += 1440;
                bitmapScheduler.markRangeBusy(ctx.userId(), evDate, sMin, eMin + ctx.bufferMinutes());
            }
        }

        for (LocalDate date : ctx.dateRange()) {
            DailyPlan plan = ctx.planMap().get(date);
            boolean isConfirmed = plan != null && Boolean.TRUE.equals(plan.getIsConfirmed());
            List<TaskTimeBlock> existingBlocks = ctx.taskTimeBlocksByDate().getOrDefault(date, Collections.emptyList());
            for (TaskTimeBlock tb : existingBlocks) {
                if (isConfirmed || "BUSY".equalsIgnoreCase(tb.getAvailabilityStatus()) || Boolean.TRUE.equals(tb.getIsLocked())) {
                    int sMin = tb.getStartTime().getHour() * 60 + tb.getStartTime().getMinute();
                    int eMin = tb.getEndTime().getHour() * 60 + tb.getEndTime().getMinute();
                    if (eMin <= sMin) eMin += 1440;
                    bitmapScheduler.markRangeBusy(ctx.userId(), date, sMin, eMin + ctx.bufferMinutes());
                }
            }
        }
    }

    private Map<LocalDate, List<TaskTimeBlock>> scheduleBlocksForDate(
            ScheduleContext ctx, TaskQueueResult queues, Set<LocalDate> datesActuallyProcessed, boolean forceRescheduleToday
    ) {
        Map<LocalDate, List<TaskTimeBlock>> generatedBlocksPerDate = new LinkedHashMap<>();
        for (LocalDate d : ctx.dateRange()) {
            generatedBlocksPerDate.put(d, new ArrayList<>());
        }

        LocalTime currentTime = LocalTime.now(ctx.zoneId());
        LocalDate today = ctx.startDate();

        for (LocalDate date : ctx.dateRange()) {
            DailyPlan planOfDate = ctx.planMap().get(date);
            if (planOfDate != null && Boolean.TRUE.equals(planOfDate.getIsConfirmed())) {
                if (!forceRescheduleToday || !date.equals(today)) {
                    continue;
                }
            }

            // MUST add to processed dates early, so that even if activeQueue is empty,
            // AutoSchedulePersister will know to run garbage collection (delete ghost blocks) on this date.
            datesActuallyProcessed.add(date);

            List<TaskQueueItem> activeQueue = new ArrayList<>();
            if (queues.datesWithDailyPlan().contains(date)) {
                List<TaskQueueItem> dateQueue = queues.dateTaskQueues().get(date);
                if (dateQueue != null && !dateQueue.isEmpty()) {
                    activeQueue.addAll(dateQueue);
                }
            }
            if (!queues.backlogQueue().isEmpty()) {
                for (TaskQueueItem bItem : queues.backlogQueue()) {
                    if (!activeQueue.contains(bItem)) {
                        activeQueue.add(bItem);
                    }
                }
            }

            if (activeQueue.isEmpty()) continue;

            int startOfDayMin;
            if (date.equals(today)) {
                int nowMin = currentTime.getHour() * 60 + currentTime.getMinute();
                int baseMin = Math.max(ctx.wakeMin(), nowMin);
                startOfDayMin = ((baseMin + 14) / 15) * 15;
            } else {
                startOfDayMin = ((ctx.wakeMin() + 14) / 15) * 15;
            }
            int endOfDayMin = ctx.sleepMin();
            if (ctx.sleepMin() < ctx.wakeMin()) {
                endOfDayMin += 1440;
            }
            
            System.out.println("AUTO-SCHEDULE DEBUG: Date=" + date + ", startOfDayMin=" + startOfDayMin + ", endOfDayMin=" + endOfDayMin + ", sleepMin=" + ctx.sleepMin() + ", wakeMin=" + ctx.wakeMin() + ", nowMin=" + (currentTime.getHour() * 60 + currentTime.getMinute()));

            // Pass 1: Strict Time Context
            Map<UUID, Integer> dailyAllocatedMinutes = new HashMap<>();
            Set<TaskQueueItem> dailyProcessedItems = new LinkedHashSet<>(activeQueue);

            runTimelineAllocation(activeQueue, date, ctx, generatedBlocksPerDate, true, startOfDayMin, endOfDayMin, dailyAllocatedMinutes);

            // Pass 2: Relaxed Time Context (Fallback)
            if (!activeQueue.isEmpty()) {
                runTimelineAllocation(activeQueue, date, ctx, generatedBlocksPerDate, false, startOfDayMin, endOfDayMin, dailyAllocatedMinutes);
            }

            // Cleanup active queues
            queues.backlogQueue().removeIf(i -> i.remainingMinutes <= 0);
            queues.dateTaskQueues().values().forEach(q -> q.removeIf(i -> i.remainingMinutes <= 0));

            // Smart Spillover: Visa check for all items processed today that still have remaining time
            boolean hasSpillover = false;
            for (TaskQueueItem item : dailyProcessedItems) {
                if (item.remainingMinutes > 0) {
                    boolean allowSpillover = true;
                    if (item.task.getGoalId() != null) {
                        Goal goal = ctx.goalMap().get(item.task.getGoalId());
                        if (goal != null && "Time-boxed".equalsIgnoreCase(goal.getGoalType())) {
                            // If Time-boxed Goal, only spillover if it has a hard due date that is NOT today
                            if (item.task.getDueDate() == null || item.task.getDueDate().toLocalDate().equals(date)) {
                                allowSpillover = false;
                            }
                        }
                    }

                    if (allowSpillover) {
                        if (!queues.backlogQueue().contains(item)) {
                            queues.backlogQueue().add(item);
                            hasSpillover = true;
                        }
                    } else {
                        // Denied Visa: Must remove from backlog queue to prevent it from snowballing
                        queues.backlogQueue().remove(item);
                        item.remainingMinutes = 0; // mark as done essentially
                    }
                }
            }

            if (hasSpillover) {
                queues.backlogQueue().sort(TaskPriorityScorer.getQueueComparator(ctx));
            }
        }

        return generatedBlocksPerDate;
    }

    private void runTimelineAllocation(
            List<TaskQueueItem> activeQueue,
            LocalDate date,
            ScheduleContext ctx,
            Map<LocalDate, List<TaskTimeBlock>> generatedBlocksPerDate,
            boolean strictTimeContext,
            int startOfDayMin,
            int endOfDayMin,
            Map<UUID, Integer> dailyAllocatedMinutes
    ) {
        int cursorMin = startOfDayMin;
        while (cursorMin < endOfDayMin && !activeQueue.isEmpty()) {
            // Move cursor forward to next free slot
            while (cursorMin < endOfDayMin && bitmapScheduler.isBusy(ctx.userId(), date, cursorMin)) {
                cursorMin += 5;
            }
            
            if (cursorMin >= endOfDayMin) break;

            // Find contiguous free time from cursorMin
            int freeLength = 0;
            while (cursorMin + freeLength < endOfDayMin && !bitmapScheduler.isBusy(ctx.userId(), date, cursorMin + freeLength)) {
                freeLength += 5;
            }

            int minChunk = activeQueue.stream()
                .mapToInt(item -> {
                    int req = 30;
                    if (item.task.getMinChunkMinutes() != null && item.task.getMinChunkMinutes() > 0) {
                        req = item.task.getMinChunkMinutes();
                    }
                    if (Boolean.FALSE.equals(item.task.getIsSplittable())) {
                        req = item.remainingMinutes;
                    }
                    return Math.min(req, item.remainingMinutes);
                })
                .min().orElse(30);

            // Giới hạn cứng: thuật toán không được phép chia quá nhỏ (< 15 phút)
            minChunk = Math.max(15, minChunk);

            if (freeLength < minChunk) {
                cursorMin += freeLength; // Skip small gaps
                continue;
            }

            TaskQueueItem selectedItem = null;
            int maxAvailableForItem = 0;
            int selectedItemDailyBudget = Integer.MAX_VALUE;
            
            for (int i = 0; i < activeQueue.size(); i++) {
                TaskQueueItem item = activeQueue.get(i);
                
                int dailyBudget = Integer.MAX_VALUE;
                if (Boolean.TRUE.equals(item.task.getIsSplittable()) && item.task.getMaxDailyDuration() != null && item.task.getMaxDailyDuration() > 0) {
                    int alreadyAllocated = dailyAllocatedMinutes.getOrDefault(item.task.getId(), 0);
                    dailyBudget = Math.max(0, item.task.getMaxDailyDuration() - alreadyAllocated);
                }

                if (dailyBudget <= 0) {
                    continue; // Reached daily limit for today
                }

                int availableFromContext = getValidAvailableMinutes(item, date, cursorMin, ctx, strictTimeContext);
                
                int requiredMinChunk = 30;
                if (item.task.getMinChunkMinutes() != null && item.task.getMinChunkMinutes() > 0) {
                    requiredMinChunk = item.task.getMinChunkMinutes();
                }
                if (Boolean.FALSE.equals(item.task.getIsSplittable())) {
                    requiredMinChunk = item.remainingMinutes;
                }
                
                requiredMinChunk = Math.min(requiredMinChunk, item.remainingMinutes);

                if (freeLength >= requiredMinChunk && availableFromContext >= requiredMinChunk && dailyBudget >= requiredMinChunk) {
                    selectedItem = item;
                    maxAvailableForItem = availableFromContext;
                    selectedItemDailyBudget = dailyBudget;
                    break;
                }
            }
            
            if (selectedItem == null) {
                // No task can be scheduled at this time. Advance cursor.
                cursorMin += 5;
                continue;
            }

            // Greedy allocation
            int maxChunk = 120; // 2 hours hard limit for single sitting
            if (Boolean.FALSE.equals(selectedItem.task.getIsSplittable())) {
                maxChunk = selectedItem.remainingMinutes; // Bypass hard limit for non-splittable tasks
            }

            int allocateSize = Math.min(selectedItem.remainingMinutes, Math.min(freeLength, maxChunk));
            allocateSize = Math.min(allocateSize, maxAvailableForItem);
            allocateSize = Math.min(allocateSize, selectedItemDailyBudget);
            
            // Align to 15m chunks ONLY if we are splitting the task (not the final chunk)
            if (allocateSize < selectedItem.remainingMinutes) {
                allocateSize = (allocateSize / 15) * 15;
            }
            
            int requiredMinChunkForSelected = 30;
            if (selectedItem.task.getMinChunkMinutes() != null && selectedItem.task.getMinChunkMinutes() > 0) {
                requiredMinChunkForSelected = selectedItem.task.getMinChunkMinutes();
            }
            if (Boolean.FALSE.equals(selectedItem.task.getIsSplittable())) {
                requiredMinChunkForSelected = selectedItem.remainingMinutes; // The initial remaining before this allocation
            }
            
            // Cap the required min chunk so we don't demand a 30m gap for a 10m task
            requiredMinChunkForSelected = Math.min(requiredMinChunkForSelected, selectedItem.remainingMinutes);

            if (allocateSize < requiredMinChunkForSelected) {
                cursorMin += 5;
                continue;
            }

            // Schedule block
            selectedItem.partsFilled++;
            LocalDateTime blockStartLdt = date.atStartOfDay().plusMinutes(cursorMin);
            LocalDateTime blockEndLdt = date.atStartOfDay().plusMinutes(cursorMin + allocateSize);

            TaskTimeBlock block = new TaskTimeBlock();
            block.setTaskId(selectedItem.task.getId());
            block.setStartTime(blockStartLdt);
            block.setEndTime(blockEndLdt);
            block.setPartIndex(selectedItem.partsFilled);
            block.setAvailabilityStatus("FREE");

            generatedBlocksPerDate.get(date).add(block);
            bitmapScheduler.markRangeBusy(ctx.userId(), date, cursorMin, cursorMin + allocateSize + ctx.bufferMinutes());

            dailyAllocatedMinutes.merge(selectedItem.task.getId(), allocateSize, Integer::sum);
            selectedItem.remainingMinutes -= allocateSize;
            
            boolean hitDailyLimit = Boolean.TRUE.equals(selectedItem.task.getIsSplittable())
                    && selectedItem.task.getMaxDailyDuration() != null
                    && dailyAllocatedMinutes.getOrDefault(selectedItem.task.getId(), 0) >= selectedItem.task.getMaxDailyDuration();

            if (selectedItem.remainingMinutes <= 0 || hitDailyLimit) {
                activeQueue.remove(selectedItem);
            }
            
            // Cursor moves to end of block
            cursorMin += allocateSize;
        }
    }

    private Integer getValidAvailableMinutes(TaskQueueItem item, LocalDate date, int cursorMin, ScheduleContext ctx, boolean strictTimeContext) {
        if (!strictTimeContext) return 1440; // Pass 2: Ignore Time Context
        if (item.priorityRank == 0) return 1440; // Hybrid Time Context: Rank 0 ignores Time Context
        if (item.task.getCategoryId() == null) return 1440;
        nhk.category.Category cat = ctx.categoryMap().get(item.task.getCategoryId());
        if (cat == null || cat.getTimeContext() == null) return 1440;
        
        nhk.timecontext.TimeContext tc = cat.getTimeContext();
        if (tc.getSlots() == null || tc.getSlots().isEmpty()) return 1440;
        
        java.time.LocalDateTime actualDateTime = date.atStartOfDay().plusMinutes(cursorMin);
        java.time.DayOfWeek actualDayOfWeek = actualDateTime.getDayOfWeek();
        int actualCursorMin = actualDateTime.getHour() * 60 + actualDateTime.getMinute();

        for (nhk.timecontext.TimeContextSlot slot : tc.getSlots()) {
            boolean matches = false;
            if (slot.getDayOfWeek() == actualDayOfWeek) {
                matches = true;
            } else {
                // Check if the slot from the previous day crosses midnight
                java.time.DayOfWeek previousDayOfWeek = actualDayOfWeek.minus(1);
                if (slot.getDayOfWeek() == previousDayOfWeek) {
                    int startMin = slot.getStartTime().getHour() * 60 + slot.getStartTime().getMinute();
                    int endMin = slot.getEndTime().getHour() * 60 + slot.getEndTime().getMinute();
                    if (endMin <= startMin && actualCursorMin < endMin) {
                        return endMin - actualCursorMin;
                    }
                }
            }

            if (matches) {
                int startMin = slot.getStartTime().getHour() * 60 + slot.getStartTime().getMinute();
                int endMin = slot.getEndTime().getHour() * 60 + slot.getEndTime().getMinute();
                
                if (endMin <= startMin) {
                    // Slot crosses midnight (e.g. 22:00 to 02:00)
                    if (actualCursorMin >= startMin) {
                        return 1440 - actualCursorMin + endMin;
                    }
                    if (actualCursorMin < endMin) {
                        return endMin - actualCursorMin;
                    }
                } else {
                    if (actualCursorMin >= startMin && actualCursorMin < endMin) {
                        return endMin - actualCursorMin;
                    }
                }
            }
        }
        return 0; // 0 means invalid at this cursorMin
    }
}
