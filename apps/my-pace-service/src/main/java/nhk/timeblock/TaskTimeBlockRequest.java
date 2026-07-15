package nhk.timeblock;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.UUID;

public record TaskTimeBlockRequest(
    @NotNull UUID taskId,
    @NotNull UUID dailyPlanId,
    @NotNull LocalDateTime startTime,
    @NotNull LocalDateTime endTime,
    Integer partIndex,
    Integer totalParts
) {
    public TaskTimeBlockRequest {
        if (partIndex == null) partIndex = 1;
        if (totalParts == null) totalParts = 1;
    }
}
