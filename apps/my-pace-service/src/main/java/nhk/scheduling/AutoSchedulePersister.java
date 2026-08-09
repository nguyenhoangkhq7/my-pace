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
            Map<LocalDate, List<TaskTimeBlock>> generatedBlocksPerDate, Set<LocalDate> datesActuallyProcessed
    ) {
        Map<LocalDate, List<TaskTimeBlockDto>> responseMap = new LinkedHashMap<>();

        for (Map.Entry<LocalDate, List<TaskTimeBlock>> entry : generatedBlocksPerDate.entrySet()) {
            LocalDate date = entry.getKey();
            List<TaskTimeBlock> rawBlocks = entry.getValue();

            DailyPlan existingPlan = ctx.planMap().get(date);
            
            // Theo Option B: KHÔNG TỰ ĐỘNG TẠO DAILY PLAN.
            // Nếu ngày hôm đó chưa có Daily Plan (existingPlan == null), 
            // hoặc đã có nhưng chưa được chốt (isConfirmed == false), thì được phép lưu TimeBlocks.
            // Nếu đã chốt, tuyệt đối không được ghi đè TimeBlocks.
            boolean isConfirmed = existingPlan != null && Boolean.TRUE.equals(existingPlan.getIsConfirmed());

            if (!isConfirmed && datesActuallyProcessed.contains(date)) {
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
                            existing.setStatusWarning(raw.getStatusWarning());
                            blocksToSave.add(existing);
                        }
                        finalFreeBlocks.add(existing);
                    } else {
                        blocksToSave.add(raw);
                        finalFreeBlocks.add(raw);
                    }
                }

                List<TaskTimeBlock> allBlocksToCalculate = new ArrayList<>(existingBusyBlocks);
                allBlocksToCalculate.addAll(finalFreeBlocks);

                Map<UUID, Integer> taskMaxParts = new HashMap<>();
                for (TaskTimeBlock b : allBlocksToCalculate) {
                    int pIndex = b.getPartIndex() != null ? b.getPartIndex() : 1;
                    taskMaxParts.put(b.getTaskId(), Math.max(taskMaxParts.getOrDefault(b.getTaskId(), 0), pIndex));
                }
                for (TaskTimeBlock b : allBlocksToCalculate) {
                    b.setTotalParts(taskMaxParts.get(b.getTaskId()));
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

                // Theo Option B: KHÔNG TỰ ĐỘNG NHÉT TASK VÀO DAILY PLAN
                // Do đó loại bỏ toàn bộ phần logic tạo DailyPlanTask ở đây.
                // Việc Pick Task vào Daily Plan sẽ do User làm thủ công (Drag & Drop từ Backlog).

                List<TaskTimeBlock> allBlocks = new ArrayList<>(existingBusyBlocks);
                allBlocks.addAll(finalFreeBlocks);
                allBlocks.sort(Comparator.comparing(TaskTimeBlock::getStartTime));

                List<TaskTimeBlockDto> dtos = allBlocks.stream()
                        .map(b -> new TaskTimeBlockDto(
                                b.getId(), b.getTaskId(),
                                b.getStartTime(), b.getEndTime(),
                                b.getPartIndex(), b.getTotalParts(),
                                b.getActualMinutes() != null ? b.getActualMinutes() : 0,
                                b.getIsCompleted() != null ? b.getIsCompleted() : false,
                                b.getCompletedAt(),
                                b.getAvailabilityStatus() != null ? b.getAvailabilityStatus() : "FREE",
                                Boolean.TRUE.equals(b.getIsLocked()),
                                b.getStatusWarning()
                        ))
                        .collect(Collectors.toList());
                responseMap.put(date, dtos);
            } else {
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
                                Boolean.TRUE.equals(b.getIsLocked()),
                                b.getStatusWarning()
                        ))
                        .collect(Collectors.toList());
                responseMap.put(date, existingDtos);
            }
        }

        List<String> schedulingWarnings = new ArrayList<>();
        int overflowMinutes = 0;
        for (List<TaskQueueItem> queue : queues.dateTaskQueues().values()) {
            for (TaskQueueItem item : queue) {
                if (item.remainingMinutes > 0) {
                    overflowMinutes += item.remainingMinutes;
                    if ("INFEASIBLE".equals(item.statusWarning) || item.remainingMinutes > 0) {
                        int est = item.task.getEstimatedMinutes() != null ? item.task.getEstimatedMinutes() : 0;
                        schedulingWarnings.add("Task '" + item.task.getTitle() + "' chỉ xếp được " + (est - item.remainingMinutes) + "/" + est + " phút.");
                    }
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
                if (item.remainingMinutes > 0) {
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
