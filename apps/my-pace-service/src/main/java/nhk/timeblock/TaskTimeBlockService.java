package nhk.timeblock;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;
import nhk.user.UserDetailsCustom;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskTimeBlockService {

    private final TaskTimeBlockRepository timeBlockRepository;
    private final DailyPlanRepository dailyPlanRepository;

    @Transactional(readOnly = true)
    public List<TaskTimeBlockDto> getTimeBlocks(UUID dailyPlanId, UserDetailsCustom userDetails) {
        DailyPlan plan = dailyPlanRepository.findById(dailyPlanId)
                .orElseThrow(() -> new EntityNotFoundException("Daily plan not found"));

        if (!plan.getUserId().equals(userDetails.user().getId())) {
            throw new EntityNotFoundException("Daily plan not found");
        }

        return timeBlockRepository.findByDailyPlanIdOrderByStartTimeAsc(dailyPlanId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<TaskTimeBlockDto> saveTimeBlocks(SaveTimeBlocksRequest request, UserDetailsCustom userDetails) {
        UUID planId = request.getDailyPlanId();

        DailyPlan plan = dailyPlanRepository.findById(planId)
                .orElseThrow(() -> new EntityNotFoundException("Daily plan not found"));

        if (!plan.getUserId().equals(userDetails.user().getId())) {
            throw new EntityNotFoundException("Daily plan not found");
        }

        // Delete all existing blocks for this plan (replace strategy)
        timeBlockRepository.deleteByDailyPlanId(planId);

        // Insert new blocks
        List<TaskTimeBlock> blocks = request.getBlocks().stream()
                .map(req -> {
                    TaskTimeBlock block = new TaskTimeBlock();
                    block.setTaskId(req.getTaskId());
                    block.setDailyPlanId(planId);
                    block.setStartTime(req.getStartTime());
                    block.setEndTime(req.getEndTime());
                    block.setPartIndex(req.getPartIndex() != null ? req.getPartIndex() : 1);
                    block.setTotalParts(req.getTotalParts() != null ? req.getTotalParts() : 1);
                    return block;
                })
                .collect(Collectors.toList());

        return timeBlockRepository.saveAll(blocks)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private TaskTimeBlockDto toDto(TaskTimeBlock block) {
        TaskTimeBlockDto dto = new TaskTimeBlockDto();
        dto.setId(block.getId());
        dto.setTaskId(block.getTaskId());
        dto.setDailyPlanId(block.getDailyPlanId());
        dto.setStartTime(block.getStartTime());
        dto.setEndTime(block.getEndTime());
        dto.setPartIndex(block.getPartIndex());
        dto.setTotalParts(block.getTotalParts());
        return dto;
    }
}
