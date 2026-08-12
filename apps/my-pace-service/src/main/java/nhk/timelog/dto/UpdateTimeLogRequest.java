package nhk.timelog.dto;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public record UpdateTimeLogRequest(
        @NotNull Integer loggedMinutes,
        @NotNull OffsetDateTime endedAt
) {
}
