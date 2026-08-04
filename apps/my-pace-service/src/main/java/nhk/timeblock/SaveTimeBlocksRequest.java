package nhk.timeblock;

import java.util.List;
import java.util.UUID;

public record SaveTimeBlocksRequest(
    java.time.LocalDate targetDate,
    List<TaskTimeBlockRequest> blocks
) {}
