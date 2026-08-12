package nhk.timeblock;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;
import nhk.task.Task;
import nhk.task.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import nhk.timelog.TimeLog;
import nhk.timelog.TimeLogRepository;
import nhk.timelog.dto.TimeLogResponse;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskTimeBlockServiceImpl implements TaskTimeBlockService {

    private final TaskTimeBlockRepository timeBlockRepository;
    private final DailyPlanRepository dailyPlanRepository;
    private final nhk.planning.DailyPlanTaskRepository dailyPlanTaskRepository;
    private final TaskRepository taskRepository;
    private final TimeLogRepository timeLogRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TaskTimeBlockDto> getTimeBlocks(java.time.LocalDate startDate, java.time.LocalDate endDate, UUID userId) {
        java.time.LocalDateTime start = startDate.atStartOfDay();
        java.time.LocalDateTime end = endDate.plusDays(1).atStartOfDay().minusNanos(1);
        return toDtoList(timeBlockRepository.findByUserIdAndDateRange(userId, start, end));
    }

    @Override
    @Transactional
    public List<TaskTimeBlockDto> saveTimeBlocks(SaveTimeBlocksRequest request, UUID userId) {
        java.time.LocalDateTime startOfDay = request.targetDate().atStartOfDay();
        java.time.LocalDateTime endOfDay = request.targetDate().plusDays(1).atStartOfDay();

        // Delete all blocks for this user on this date
        timeBlockRepository.deleteByUserIdAndDate(userId, startOfDay, endOfDay);

        // Clean up stale FREE blocks for these tasks on other dates
        List<UUID> taskIds = request.blocks().stream()
                .map(TaskTimeBlockRequest::taskId)
                .distinct()
                .collect(Collectors.toList());

        if (!taskIds.isEmpty()) {
            List<TaskTimeBlock> existingTaskBlocks = timeBlockRepository.findByTaskIdIn(taskIds);
            List<TaskTimeBlock> staleFreeBlocks = existingTaskBlocks.stream()
                    .filter(b -> !"BUSY".equalsIgnoreCase(b.getAvailabilityStatus()))
                    .filter(b -> !b.getStartTime().toLocalDate().equals(request.targetDate()))
                    .collect(Collectors.toList());
            if (!staleFreeBlocks.isEmpty()) {
                timeBlockRepository.deleteAll(staleFreeBlocks);
            }
        }

        // Insert new blocks
        List<TaskTimeBlock> blocks = request.blocks().stream()
                .map(req -> {
                    TaskTimeBlock block = new TaskTimeBlock();
                    block.setTaskId(req.taskId());
                    block.setStartTime(req.startTime());
                    block.setEndTime(req.endTime());
                    block.setPartIndex(req.partIndex() != null ? req.partIndex() : 1);
                    block.setTotalParts(req.totalParts() != null ? req.totalParts() : 1);
                    block.setAvailabilityStatus(req.availabilityStatus() != null ? req.availabilityStatus() : "FREE");
                    return block;
                })
                .collect(Collectors.toList());

        return toDtoList(timeBlockRepository.saveAll(blocks));
    }



    @Override
    @Transactional
    public List<TaskTimeBlockDto> splitTimeBlock(UUID blockId, Integer splitAtMinutes, UUID userId) {
        TaskTimeBlock original = timeBlockRepository.findById(blockId)
                .orElseThrow(() -> new EntityNotFoundException("Time block not found"));

        Task task = taskRepository.findById(original.getTaskId())
                .orElseThrow(() -> new EntityNotFoundException("Time block not found"));

        if (!task.getUserId().equals(userId)) {
            throw new EntityNotFoundException("Time block not found");
        }

        long totalMinutes = java.time.Duration.between(original.getStartTime(), original.getEndTime()).toMinutes();
        int splitVal = (splitAtMinutes != null && splitAtMinutes > 0) ? splitAtMinutes : (int) (totalMinutes / 2);
        if (splitVal <= 0 || splitVal >= totalMinutes) {
            return List.of(toDto(original));
        }

        java.time.LocalDateTime splitTime = original.getStartTime().plusMinutes(splitVal);
        java.time.LocalDateTime originalEnd = original.getEndTime();

        original.setEndTime(splitTime);
        int oldTotal = original.getTotalParts() != null ? original.getTotalParts() : 1;
        original.setTotalParts(oldTotal + 1);

        TaskTimeBlock newBlock = new TaskTimeBlock();
        newBlock.setTaskId(original.getTaskId());
        newBlock.setStartTime(splitTime);
        newBlock.setEndTime(originalEnd);
        newBlock.setPartIndex((original.getPartIndex() != null ? original.getPartIndex() : 1) + 1);
        newBlock.setTotalParts(oldTotal + 1);
        newBlock.setAvailabilityStatus(original.getAvailabilityStatus());

        timeBlockRepository.save(original);
        timeBlockRepository.save(newBlock);

        java.time.LocalDateTime startOfDay = original.getStartTime().toLocalDate().atStartOfDay();
        java.time.LocalDateTime endOfDay = original.getStartTime().toLocalDate().plusDays(1).atStartOfDay().minusNanos(1);
        return toDtoList(timeBlockRepository.findByUserIdAndDateRange(userId, startOfDay, endOfDay));
    }

    @Override
    @Transactional
    public TaskTimeBlockDto toggleTimeBlockLockStatus(UUID blockId, String availabilityStatus, UUID userId) {
        TaskTimeBlock block = timeBlockRepository.findById(blockId)
                .orElseThrow(() -> new EntityNotFoundException("Time block not found"));

        Task ownerTask = taskRepository.findById(block.getTaskId())
                .orElseThrow(() -> new EntityNotFoundException("Time block not found"));

        if (!ownerTask.getUserId().equals(userId)) {
            throw new EntityNotFoundException("Time block not found");
        }

        if (!"BUSY".equalsIgnoreCase(availabilityStatus) && !"FREE".equalsIgnoreCase(availabilityStatus)) {
            throw new IllegalArgumentException("Invalid availability status. Must be BUSY or FREE");
        }

        block.setAvailabilityStatus(availabilityStatus.toUpperCase());
        TaskTimeBlock savedBlock = timeBlockRepository.save(block);

        UUID taskId = block.getTaskId();
        List<TaskTimeBlock> allTaskBlocks = timeBlockRepository.findByTaskId(taskId);
        
        boolean allBusy = !allTaskBlocks.isEmpty() && allTaskBlocks.stream()
                .allMatch(b -> "BUSY".equalsIgnoreCase(b.getAvailabilityStatus()));

        Task task = taskRepository.findById(taskId).orElse(null);
        if (task != null) {
            if (allBusy) {
                task.setStatus("Confirmed");
            } else {
                task.setStatus("Picked for Today");
            }
            taskRepository.save(task);
        }

        return toDto(savedBlock);
    }

    @Override
    @Transactional
    public TaskTimeBlockDto updateTimeBlock(UUID blockId, TaskTimeBlockController.UpdateTimeBlockRequest request, UUID userId) {
        TaskTimeBlock block = timeBlockRepository.findById(blockId)
                .orElseThrow(() -> new EntityNotFoundException("Time block not found"));

        Task task = taskRepository.findById(block.getTaskId())
                .orElseThrow(() -> new EntityNotFoundException("Time block not found"));

        if (!task.getUserId().equals(userId)) {
            throw new EntityNotFoundException("Time block not found");
        }

        if (request.startTime() != null) {
            block.setStartTime(request.startTime());
        }
        if (request.endTime() != null) {
            block.setEndTime(request.endTime());
        }
        if (request.availabilityStatus() != null) {
            if (!"BUSY".equalsIgnoreCase(request.availabilityStatus()) && !"FREE".equalsIgnoreCase(request.availabilityStatus())) {
                throw new IllegalArgumentException("Invalid availability status. Must be BUSY or FREE");
            }
            block.setAvailabilityStatus(request.availabilityStatus().toUpperCase());
        }

        TaskTimeBlock savedBlock = timeBlockRepository.save(block);

        // Recalculate total estimated minutes for the task
        List<TaskTimeBlock> allBlocks = timeBlockRepository.findByTaskId(block.getTaskId());
        long totalMinutes = 0;
        for (TaskTimeBlock b : allBlocks) {
            totalMinutes += java.time.Duration.between(b.getStartTime(), b.getEndTime()).toMinutes();
        }

        task.setEstimatedMinutes((int) totalMinutes);
        taskRepository.save(task);

        return toDto(savedBlock);
    }

    @Override
    @Transactional
    public TaskTimeBlockDto toggleLock(UUID blockId, UUID userId) {
        TaskTimeBlock block = timeBlockRepository.findById(blockId)
                .orElseThrow(() -> new EntityNotFoundException("Time block not found"));

        java.time.LocalDate date = block.getStartTime().toLocalDate();
        DailyPlan plan = dailyPlanRepository.findByUserIdAndPlanDate(userId, date).orElse(null);

        if (plan == null) {
            throw new IllegalStateException("Cannot lock timeblock for a task that is not in the daily plan");
        }

        List<nhk.planning.DailyPlanTask> planTasks = dailyPlanTaskRepository.findByDailyPlanIdOrderBySortOrderAsc(plan.getId());
        boolean isInDailyPlan = planTasks.stream().anyMatch(pt -> pt.getTask() != null && pt.getTask().getId().equals(block.getTaskId()));

        if (!isInDailyPlan) {
            throw new IllegalStateException("Cannot lock timeblock for a task that is not in the daily plan");
        }

        block.setIsLocked(!Boolean.TRUE.equals(block.getIsLocked()));
        TaskTimeBlock savedBlock = timeBlockRepository.save(block);
        return toDto(savedBlock);
    }

    private List<TaskTimeBlockDto> toDtoList(List<TaskTimeBlock> blocks) {
        if (blocks.isEmpty()) return List.of();
        List<UUID> blockIds = blocks.stream().map(TaskTimeBlock::getId).toList();
        List<TimeLog> allLogs = timeLogRepository.findByTimeBlockIdIn(blockIds);
        Map<UUID, List<TimeLog>> logsByBlockId = allLogs.stream()
                .collect(Collectors.groupingBy(TimeLog::getTimeBlockId));
        return blocks.stream().map(block -> {
            List<TimeLog> logs = logsByBlockId.getOrDefault(block.getId(), List.of());
            List<TimeLogResponse> logResponses = logs.stream()
                    .sorted(Comparator.comparing(TimeLog::getStartedAt))
                    .map(tl -> new TimeLogResponse(
                            tl.getId(), tl.getTimeBlockId(), tl.getTaskId(),
                            tl.getLoggedMinutes(), tl.getStartedAt(), tl.getEndedAt(), tl.getCreatedAt()))
                    .toList();
            int totalLogged = logs.stream().mapToInt(TimeLog::getLoggedMinutes).sum();
            return new TaskTimeBlockDto(
                    block.getId(), block.getTaskId(),
                    block.getStartTime(), block.getEndTime(),
                    block.getPartIndex() != null ? block.getPartIndex() : 1,
                    block.getTotalParts() != null ? block.getTotalParts() : 1,
                    block.getAvailabilityStatus() != null ? block.getAvailabilityStatus() : "FREE",
                    Boolean.TRUE.equals(block.getIsLocked()),
                    block.getCreatedAt(),
                    logResponses, totalLogged, !logs.isEmpty()
            );
        }).toList();
    }

    private TaskTimeBlockDto toDto(TaskTimeBlock block) {
        List<TimeLog> logs = timeLogRepository.findByTimeBlockIdOrderByStartedAtAsc(block.getId());
        List<TimeLogResponse> logResponses = logs.stream()
                .map(tl -> new TimeLogResponse(
                        tl.getId(), tl.getTimeBlockId(), tl.getTaskId(),
                        tl.getLoggedMinutes(), tl.getStartedAt(), tl.getEndedAt(), tl.getCreatedAt()))
                .toList();
        int totalLogged = logs.stream().mapToInt(TimeLog::getLoggedMinutes).sum();
        return new TaskTimeBlockDto(
                block.getId(),
                block.getTaskId(),
                block.getStartTime(),
                block.getEndTime(),
                block.getPartIndex() != null ? block.getPartIndex() : 1,
                block.getTotalParts() != null ? block.getTotalParts() : 1,
                block.getAvailabilityStatus() != null ? block.getAvailabilityStatus() : "FREE",
                Boolean.TRUE.equals(block.getIsLocked()),
                block.getCreatedAt(),
                logResponses,
                totalLogged,
                !logs.isEmpty()
        );
    }
}
