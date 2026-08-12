package nhk.timeblock;

import nhk.timelog.dto.TimeLogResponse;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record TaskTimeBlockDto(
    UUID id,
    UUID taskId,
    LocalDateTime startTime,
    LocalDateTime endTime,
    Integer partIndex,
    Integer totalParts,
    String availabilityStatus,
    Boolean isLocked,
    OffsetDateTime createdAt,
    List<TimeLogResponse> timeLogs,
    Integer totalLoggedMinutes,
    Boolean hasTimeLogs
) {}
