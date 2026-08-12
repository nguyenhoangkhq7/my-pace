package nhk.timelog.dto;

import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CreateTimeLogRequest(
    UUID timeBlockId,
    @NotNull UUID taskId,
    @NotNull Integer loggedMinutes,
    @NotNull OffsetDateTime startedAt,
    @NotNull OffsetDateTime endedAt
) {}
