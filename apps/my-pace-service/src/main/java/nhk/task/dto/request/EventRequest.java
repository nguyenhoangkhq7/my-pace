package nhk.task.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record EventRequest(
        @NotNull @Size(max = 255) String title,
        String description,
        @NotNull LocalDateTime startAt,
        @NotNull LocalDateTime endAt,
        Boolean isRecurring,
        String recurrenceRule
) {
}

