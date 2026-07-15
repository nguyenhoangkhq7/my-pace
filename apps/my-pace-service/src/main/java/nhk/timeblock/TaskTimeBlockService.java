package nhk.timeblock;

import java.util.List;
import java.util.UUID;

public interface TaskTimeBlockService {
    List<TaskTimeBlockDto> getTimeBlocks(UUID dailyPlanId, UUID userId);
    List<TaskTimeBlockDto> saveTimeBlocks(SaveTimeBlocksRequest request, UUID userId);
}
