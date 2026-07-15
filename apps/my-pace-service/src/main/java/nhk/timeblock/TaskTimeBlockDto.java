package nhk.timeblock;

import java.time.LocalDateTime;
import java.util.UUID;

public record TaskTimeBlockDto(
    UUID id,
    UUID taskId,
    UUID dailyPlanId,
    LocalDateTime startTime,
    LocalDateTime endTime,
    Integer partIndex,
    Integer totalParts
) {}
