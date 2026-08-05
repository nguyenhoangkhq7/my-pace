package nhk.timeblock;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;
import nhk.task.Task;
import nhk.task.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskTimeBlockServiceImpl implements TaskTimeBlockService {

    private final TaskTimeBlockRepository timeBlockRepository;
    private final DailyPlanRepository dailyPlanRepository;
    private final TaskRepository taskRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TaskTimeBlockDto> getTimeBlocks(java.time.LocalDate startDate, java.time.LocalDate endDate, UUID userId) {
        java.time.LocalDateTime start = startDate.atStartOfDay();
        java.time.LocalDateTime end = endDate.plusDays(1).atStartOfDay().minusNanos(1);
        return timeBlockRepository.findByUserIdAndDateRange(userId, start, end)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
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

        return timeBlockRepository.saveAll(blocks)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TaskTimeBlockDto updateTimeBlockProgress(UUID blockId, Integer actualMinutes, Boolean isCompleted, UUID userId) {
        TaskTimeBlock block = timeBlockRepository.findById(blockId)
                .orElseThrow(() -> new EntityNotFoundException("Time block not found"));

        Task task = taskRepository.findById(block.getTaskId())
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));

        if (!task.getUserId().equals(userId)) {
            throw new IllegalArgumentException("User does not own this task");
        }

        if (actualMinutes != null) {
            int prevActual = task.getActualMinutes() != null ? task.getActualMinutes() : 0;
            task.setActualMinutes(prevActual + actualMinutes);
        }

        if (Boolean.TRUE.equals(isCompleted)) {
            task.setStatus("Done");
            task.setDoneAt(OffsetDateTime.now());
        }

        taskRepository.save(task);

        return toDto(block);
    }

    @Override
    @Transactional
    public List<TaskTimeBlockDto> splitTimeBlock(UUID blockId, Integer splitAtMinutes, UUID userId) {
        TaskTimeBlock original = timeBlockRepository.findById(blockId)
                .orElseThrow(() -> new EntityNotFoundException("Time block not found"));

        long totalMinutes = java.time.Duration.between(original.getStartTime(), original.getEndTime()).toMinutes();
        if (splitAtMinutes <= 0 || splitAtMinutes >= totalMinutes) {
            throw new IllegalArgumentException("Split duration must be strictly between start and end");
        }

        java.time.LocalDateTime splitTime = original.getStartTime().plusMinutes(splitAtMinutes);
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
        return timeBlockRepository.findByUserIdAndDateRange(userId, startOfDay, endOfDay)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TaskTimeBlockDto toggleTimeBlockLockStatus(UUID blockId, String availabilityStatus, UUID userId) {
        TaskTimeBlock block = timeBlockRepository.findById(blockId)
                .orElseThrow(() -> new EntityNotFoundException("Time block not found"));

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

        Task task = taskRepository.findById(block.getTaskId()).orElse(null);
        if (task != null) {
            task.setEstimatedMinutes((int) totalMinutes);
            taskRepository.save(task);
        }

        return toDto(savedBlock);
    }

    private TaskTimeBlockDto toDto(TaskTimeBlock block) {
        return new TaskTimeBlockDto(
                block.getId(),
                block.getTaskId(),
                block.getStartTime(),
                block.getEndTime(),
                block.getPartIndex() != null ? block.getPartIndex() : 1,
                block.getTotalParts() != null ? block.getTotalParts() : 1,
                block.getActualMinutes() != null ? block.getActualMinutes() : 0,
                block.getIsCompleted() != null ? block.getIsCompleted() : false,
                block.getCompletedAt(),
                block.getAvailabilityStatus() != null ? block.getAvailabilityStatus() : "FREE"
        );
    }
}
