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
            throw new EntityNotFoundException("Time block not found");
        }

        if (actualMinutes != null && actualMinutes >= 0) {
            block.setActualMinutes(actualMinutes);
            // Marking progress switches availability to BUSY
            block.setAvailabilityStatus("BUSY");
        }

        if (isCompleted != null) {
            block.setIsCompleted(isCompleted);
            if (isCompleted) {
                block.setCompletedAt(OffsetDateTime.now());
                block.setAvailabilityStatus("BUSY");
            } else {
                block.setCompletedAt(null);
            }
        }

        TaskTimeBlock savedBlock = timeBlockRepository.save(block);

        // Rollup actualMinutes to Task entity
        UUID taskId = block.getTaskId();
        List<TaskTimeBlock> allTaskBlocks = timeBlockRepository.findByTaskId(taskId);
        int totalTaskActualMinutes = allTaskBlocks.stream()
                .mapToInt(b -> b.getActualMinutes() != null ? b.getActualMinutes() : 0)
                .sum();

        taskRepository.findById(taskId).ifPresent(t -> {
            t.setActualMinutes(totalTaskActualMinutes);
            if (t.getEstimatedMinutes() != null && totalTaskActualMinutes >= t.getEstimatedMinutes()) {
                t.setStatus("Done");
                t.setDoneAt(OffsetDateTime.now());
            }
            taskRepository.save(t);
        });

        return toDto(savedBlock);
    }

    @Override
    @Transactional
    public List<TaskTimeBlockDto> splitTimeBlock(UUID blockId, Integer splitAtMinutes, UUID userId) {
        TaskTimeBlock block = timeBlockRepository.findById(blockId)
                .orElseThrow(() -> new EntityNotFoundException("Time block not found"));

        Task task = taskRepository.findById(block.getTaskId())
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));

        if (!task.getUserId().equals(userId)) {
            throw new EntityNotFoundException("Time block not found");
        }

        long totalDurationMinutes = java.time.Duration.between(block.getStartTime(), block.getEndTime()).toMinutes();
        int splitPoint = (splitAtMinutes != null && splitAtMinutes > 0 && splitAtMinutes < totalDurationMinutes)
                ? splitAtMinutes
                : (int) totalDurationMinutes / 2;

        if (splitPoint <= 0 || splitPoint >= totalDurationMinutes) {
            return List.of(toDto(block));
        }

        java.time.LocalDateTime originalEnd = block.getEndTime();
        java.time.LocalDateTime splitTime = block.getStartTime().plusMinutes(splitPoint);

        block.setEndTime(splitTime);
        timeBlockRepository.save(block);

        TaskTimeBlock newBlock = new TaskTimeBlock();
        newBlock.setTaskId(block.getTaskId());
        newBlock.setStartTime(splitTime);
        newBlock.setEndTime(originalEnd);
        newBlock.setPartIndex(block.getPartIndex() + 1);
        newBlock.setTotalParts(block.getTotalParts() + 1);
        newBlock.setAvailabilityStatus(block.getAvailabilityStatus() != null ? block.getAvailabilityStatus() : "FREE");
        timeBlockRepository.save(newBlock);

        java.time.LocalDateTime start = block.getStartTime().toLocalDate().atStartOfDay();
        java.time.LocalDateTime end = block.getStartTime().toLocalDate().plusDays(1).atStartOfDay().minusNanos(1);
        return timeBlockRepository.findByUserIdAndDateRange(userId, start, end)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TaskTimeBlockDto toggleTimeBlockLockStatus(UUID blockId, String availabilityStatus, UUID userId) {
        TaskTimeBlock block = timeBlockRepository.findById(blockId)
                .orElseThrow(() -> new EntityNotFoundException("Time block not found"));

        Task task = taskRepository.findById(block.getTaskId())
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));

        if (!task.getUserId().equals(userId)) {
            throw new EntityNotFoundException("Time block not found");
        }

        String status = "BUSY".equalsIgnoreCase(availabilityStatus) ? "BUSY" : "FREE";
        block.setAvailabilityStatus(status);
        return toDto(timeBlockRepository.save(block));
    }

    @Override
    @Transactional
    public TaskTimeBlockDto updateTimeBlock(UUID blockId, TaskTimeBlockController.UpdateTimeBlockRequest request, UUID userId) {
        TaskTimeBlock block = timeBlockRepository.findById(blockId)
                .orElseThrow(() -> new EntityNotFoundException("Block not found"));
        
        // Authorize (if needed, but assuming user owns the task)
        
        if (request.startTime() != null) {
            block.setStartTime(request.startTime());
        }
        if (request.endTime() != null) {
            block.setEndTime(request.endTime());
        }
        if (request.availabilityStatus() != null) {
            block.setAvailabilityStatus(request.availabilityStatus());
        }
        
        return toDto(timeBlockRepository.save(block));
    }

    private TaskTimeBlockDto toDto(TaskTimeBlock block) {
        return new TaskTimeBlockDto(
            block.getId(),
            block.getTaskId(),
            block.getStartTime(),
            block.getEndTime(),
            block.getPartIndex(),
            block.getTotalParts(),
            block.getActualMinutes() != null ? block.getActualMinutes() : 0,
            block.getIsCompleted() != null ? block.getIsCompleted() : false,
            block.getCompletedAt(),
            block.getAvailabilityStatus() != null ? block.getAvailabilityStatus() : "FREE"
        );
    }
}
