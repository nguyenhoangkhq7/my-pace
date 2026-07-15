package nhk.timeblock;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskTimeBlockServiceImpl implements TaskTimeBlockService {

    private final TaskTimeBlockRepository timeBlockRepository;
    private final DailyPlanRepository dailyPlanRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TaskTimeBlockDto> getTimeBlocks(UUID dailyPlanId, UUID userId) {
        DailyPlan plan = dailyPlanRepository.findById(dailyPlanId)
                .orElseThrow(() -> new EntityNotFoundException("Daily plan not found"));

        if (!plan.getUserId().equals(userId)) {
            throw new EntityNotFoundException("Daily plan not found");
        }

        return timeBlockRepository.findByDailyPlanIdOrderByStartTimeAsc(dailyPlanId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<TaskTimeBlockDto> saveTimeBlocks(SaveTimeBlocksRequest request, UUID userId) {
        UUID planId = request.dailyPlanId();

        DailyPlan plan = dailyPlanRepository.findById(planId)
                .orElseThrow(() -> new EntityNotFoundException("Daily plan not found"));

        if (!plan.getUserId().equals(userId)) {
            throw new EntityNotFoundException("Daily plan not found");
        }

        // Delete all existing blocks for this plan (replace strategy)
        timeBlockRepository.deleteByDailyPlanId(planId);

        // Insert new blocks
        List<TaskTimeBlock> blocks = request.blocks().stream()
                .map(req -> {
                    TaskTimeBlock block = new TaskTimeBlock();
                    block.setTaskId(req.taskId());
                    block.setDailyPlanId(planId);
                    block.setStartTime(req.startTime());
                    block.setEndTime(req.endTime());
                    block.setPartIndex(req.partIndex() != null ? req.partIndex() : 1);
                    block.setTotalParts(req.totalParts() != null ? req.totalParts() : 1);
                    return block;
                })
                .collect(Collectors.toList());

        return timeBlockRepository.saveAll(blocks)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private TaskTimeBlockDto toDto(TaskTimeBlock block) {
        return new TaskTimeBlockDto(
            block.getId(),
            block.getTaskId(),
            block.getDailyPlanId(),
            block.getStartTime(),
            block.getEndTime(),
            block.getPartIndex(),
            block.getTotalParts()
        );
    }
}
