package nhk.timeblock;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TaskTimeBlockDto(
    UUID id,
    UUID taskId,
    LocalDateTime startTime,
    LocalDateTime endTime,
    Integer partIndex,
    Integer totalParts,
    Integer actualMinutes,
    Boolean isCompleted,
    OffsetDateTime completedAt,
    String availabilityStatus,
    Boolean isLocked,
    String statusWarning
) {}
