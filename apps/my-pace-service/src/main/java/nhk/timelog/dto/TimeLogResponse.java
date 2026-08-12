package nhk.timelog.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TimeLogResponse(
    UUID id,
    UUID timeBlockId,
    UUID taskId,
    Integer loggedMinutes,
    OffsetDateTime startedAt,
    OffsetDateTime endedAt,
    OffsetDateTime createdAt
) {}
