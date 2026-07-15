package nhk.timeblock;

import java.util.List;
import java.util.UUID;

public record SaveTimeBlocksRequest(
    UUID dailyPlanId,
    List<TaskTimeBlockRequest> blocks
) {}
