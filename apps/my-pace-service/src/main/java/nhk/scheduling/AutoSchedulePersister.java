package nhk.scheduling;

import lombok.RequiredArgsConstructor;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;
import nhk.planning.DailyPlanTask;
import nhk.planning.DailyPlanTaskRepository;
import nhk.task.Task;
import nhk.timeblock.TaskTimeBlock;
import nhk.timeblock.TaskTimeBlockDto;
import nhk.timeblock.TaskTimeBlockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AutoSchedulePersister {

    private final DailyPlanRepository dailyPlanRepository;
    private final TaskTimeBlockRepository timeBlockRepository;
    private final DailyPlanTaskRepository dailyPlanTaskRepository;

    @Transactional
    public AutoScheduleResponse persistAndReconcile(
            ScheduleContext ctx, TaskQueueResult queues,
            Map<LocalDate, List<TaskTimeBlock>> generatedBlocksPerDate, Set<LocalDate> datesActuallyProcessed,
            boolean forceRescheduleToday
    ) {
        Map<LocalDate, List<TaskTimeBlockDto>> responseMap = new LinkedHashMap<>();

        // Compute global max parts for each task across the entire schedule
        Map<UUID, Integer> globalTaskMaxParts = new HashMap<>();
        for (List<TaskTimeBlock> rawBlocks : generatedBlocksPerDate.values()) {
            for (TaskTimeBlock b : rawBlocks) {
                int pIndex = b.getPartIndex() != null ? b.getPartIndex() : 1;
                globalTaskMaxParts.put(b.getTaskId(), Math.max(globalTaskMaxParts.getOrDefault(b.getTaskId(), 0), pIndex));
            }
        }
        for (List<TaskTimeBlock> blocks : ctx.taskTimeBlocksByDate().values()) {
            for (TaskTimeBlock b : blocks) {
                if ("BUSY".equalsIgnoreCase(b.getAvailabilityStatus()) || Boolean.TRUE.equals(b.getIsLocked())) {
                    int pIndex = b.getPartIndex() != null ? b.getPartIndex() : 1;
                    globalTaskMaxParts.put(b.getTaskId(), Math.max(globalTaskMaxParts.getOrDefault(b.getTaskId(), 0), pIndex));
                }
            }
        }

        for (Map.Entry<LocalDate, List<TaskTimeBlock>> entry : generatedBlocksPerDate.entrySet()) {
            LocalDate date = entry.getKey();
            List<TaskTimeBlock> rawBlocks = entry.getValue();

            DailyPlan existingPlan = ctx.planMap().get(date);
            
            // Theo Option B: KHÔNG TỰ ĐỘNG TẠO DAILY PLAN.
            // Nếu ngày hôm đó chưa có Daily Plan (existingPlan == null), 
            // hoặc đã có nhưng chưa được chốt (isConfirmed == false), thì được phép lưu TimeBlocks.
            // Nếu đã chốt, tuyệt đối không được ghi đè TimeBlocks.
            boolean isConfirmed = existingPlan != null && Boolean.TRUE.equals(existingPlan.getIsConfirmed());
            LocalDate today = LocalDate.now(ctx.zoneId());
            boolean allowOverride = forceRescheduleToday && date.equals(today);

            if ((!isConfirmed || allowOverride) && datesActuallyProcessed.contains(date)) {
                java.time.LocalDateTime start;
                java.time.LocalDateTime end;
                if (ctx.sleepMin() < ctx.wakeMin()) {
                    start = date.atStartOfDay().plusMinutes(ctx.wakeMin());
                    end = date.plusDays(1).atStartOfDay().plusMinutes(ctx.sleepMin());
                } else {
                    start = date.atStartOfDay();
                    end = date.plusDays(1).atStartOfDay();
                }
                
                List<TaskTimeBlock> allExistingBlocks = timeBlockRepository.findByUserIdAndDateRange(ctx.userId(), start, end);

                // Preserve both BUSY and isLocked blocks without modification
                List<TaskTimeBlock> existingPreservedBlocks = allExistingBlocks.stream()
                        .filter(b -> "BUSY".equalsIgnoreCase(b.getAvailabilityStatus()) || Boolean.TRUE.equals(b.getIsLocked()))
                        .collect(Collectors.toList());

                List<TaskTimeBlock> existingModifiableFreeBlocks = allExistingBlocks.stream()
                        .filter(b -> !"BUSY".equalsIgnoreCase(b.getAvailabilityStatus()) && !Boolean.TRUE.equals(b.getIsLocked()))
                        .collect(Collectors.toList());

                Map<String, TaskTimeBlock> existingFreeMap = new HashMap<>();
                for (TaskTimeBlock b : existingModifiableFreeBlocks) {
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
                        boolean timeChanged = !existing.getStartTime().equals(raw.getStartTime()) || !existing.getEndTime().equals(raw.getEndTime());
                        boolean partIndexChanged = !Objects.equals(existing.getPartIndex(), raw.getPartIndex());
                        int totalParts = globalTaskMaxParts.getOrDefault(raw.getTaskId(), 1);
                        boolean totalPartsChanged = !Objects.equals(existing.getTotalParts(), totalParts);

                        if (timeChanged || partIndexChanged || totalPartsChanged) {
                            existing.setStartTime(raw.getStartTime());
                            existing.setEndTime(raw.getEndTime());
                            existing.setPartIndex(raw.getPartIndex());
                            existing.setTotalParts(totalParts);
                            blocksToSave.add(existing);
                        }
                        finalFreeBlocks.add(existing);
                    } else {
                        raw.setTotalParts(globalTaskMaxParts.getOrDefault(raw.getTaskId(), 1));
                        blocksToSave.add(raw);
                        finalFreeBlocks.add(raw);
                    }
                }

                for (TaskTimeBlock b : existingPreservedBlocks) {
                    int totalParts = globalTaskMaxParts.getOrDefault(b.getTaskId(), 1);
                    if (!Objects.equals(b.getTotalParts(), totalParts)) {
                        b.setTotalParts(totalParts);
                        blocksToSave.add(b);
                    }
                }

                List<TaskTimeBlock> blocksToDelete = existingModifiableFreeBlocks.stream()
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

                List<TaskTimeBlock> allBlocks = new ArrayList<>(existingPreservedBlocks);
                allBlocks.addAll(finalFreeBlocks);
                allBlocks.sort(Comparator.comparing(TaskTimeBlock::getStartTime));

                List<TaskTimeBlockDto> dtos = allBlocks.stream()
                        .map(b -> new TaskTimeBlockDto(
                                b.getId(), b.getTaskId(),
                                b.getStartTime(), b.getEndTime(),
                                b.getPartIndex(), b.getTotalParts(),
                                b.getAvailabilityStatus() != null ? b.getAvailabilityStatus() : "FREE",
                                Boolean.TRUE.equals(b.getIsLocked()),
                                b.getCreatedAt(),
                                java.util.List.of(),
                                0,
                                false
                        ))
                        .collect(Collectors.toList());
                responseMap.put(date, dtos);
            } else {
                java.time.LocalDateTime start;
                java.time.LocalDateTime end;
                if (ctx.sleepMin() < ctx.wakeMin()) {
                    start = date.atStartOfDay().plusMinutes(ctx.wakeMin());
                    end = date.plusDays(1).atStartOfDay().plusMinutes(ctx.sleepMin());
                } else {
                    start = date.atStartOfDay();
                    end = date.plusDays(1).atStartOfDay();
                }
                List<TaskTimeBlockDto> existingDtos = timeBlockRepository.findByUserIdAndDateRange(ctx.userId(), start, end)
                        .stream()
                        .map(b -> new TaskTimeBlockDto(
                                b.getId(), b.getTaskId(),
                                b.getStartTime(), b.getEndTime(),
                                b.getPartIndex(), b.getTotalParts(),
                                b.getAvailabilityStatus() != null ? b.getAvailabilityStatus() : "FREE",
                                Boolean.TRUE.equals(b.getIsLocked()),
                                b.getCreatedAt(),
                                java.util.List.of(),
                                0,
                                false
                        ))
                        .collect(Collectors.toList());
                responseMap.put(date, existingDtos);
            }
        }

        List<String> schedulingWarnings = new ArrayList<>();
        int overflowMinutes = 0;
        Set<UUID> countedOverflowTaskIds = new HashSet<>();

        for (List<TaskQueueItem> queue : queues.dateTaskQueues().values()) {
            for (TaskQueueItem item : queue) {
                if (item.remainingMinutes > 0 && countedOverflowTaskIds.add(item.task.getId())) {
                    overflowMinutes += item.remainingMinutes;
                    int est = item.task.getEstimatedMinutes() != null ? item.task.getEstimatedMinutes() : 0;
                    schedulingWarnings.add("Task '" + item.task.getTitle() + "' chỉ xếp được " + (est - item.remainingMinutes) + "/" + est + " phút.");
                }
            }
        }
        boolean scheduledBacklog = false;
        for (LocalDate d : ctx.dateRange()) {
            if (!queues.datesWithDailyPlan().contains(d)) {
                scheduledBacklog = true;
                break;
            }
        }

        if (scheduledBacklog) {
            for (TaskQueueItem item : queues.backlogQueue()) {
                if (item.remainingMinutes > 0 && countedOverflowTaskIds.add(item.task.getId())) {
                    overflowMinutes += item.remainingMinutes;
                    int est = item.task.getEstimatedMinutes() != null ? item.task.getEstimatedMinutes() : 0;
                    schedulingWarnings.add("Task '" + item.task.getTitle() + "' chỉ xếp được " + (est - item.remainingMinutes) + "/" + est + " phút.");
                }
            }
        }
        boolean isOverscheduled = overflowMinutes > 0;

        return new AutoScheduleResponse(ctx.startDate(), ctx.endDate(), responseMap, overflowMinutes, isOverscheduled, schedulingWarnings);
    }
}
