package nhk.timeblock;

import java.util.List;
import java.util.UUID;

public interface TaskTimeBlockService {
    List<TaskTimeBlockDto> getTimeBlocks(java.time.LocalDate startDate, java.time.LocalDate endDate, UUID userId);
    List<TaskTimeBlockDto> saveTimeBlocks(SaveTimeBlocksRequest request, UUID userId);
    TaskTimeBlockDto updateTimeBlockProgress(UUID blockId, Integer actualMinutes, Boolean isCompleted, UUID userId);
    List<TaskTimeBlockDto> splitTimeBlock(UUID blockId, Integer splitAtMinutes, UUID userId);
    TaskTimeBlockDto toggleTimeBlockLockStatus(UUID blockId, String availabilityStatus, UUID userId);
    TaskTimeBlockDto updateTimeBlock(UUID blockId, TaskTimeBlockController.UpdateTimeBlockRequest request, UUID userId);
}
