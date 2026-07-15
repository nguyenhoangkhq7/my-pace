package nhk.task;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record TaskChecklistItemRequest(
    UUID id,
    @NotBlank String title,
    Boolean isCompleted,
    Integer orderIndex
) {}
