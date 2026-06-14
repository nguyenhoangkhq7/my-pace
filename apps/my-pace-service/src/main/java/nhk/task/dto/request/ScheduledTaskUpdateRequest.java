package nhk.task.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ScheduledTaskUpdateRequest(
        @NotNull LocalDateTime startTime,
        @NotNull LocalDateTime endTime
) {
}

