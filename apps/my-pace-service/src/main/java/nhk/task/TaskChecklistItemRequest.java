package nhk.task;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record TaskChecklistItemRequest(
    UUID id,
    @NotBlank(message = "Checklist title is required")
    @Size(max = 255, message = "Checklist title cannot exceed 255 characters")
    String title,
    Boolean isCompleted,
    @Min(value = 0, message = "Order index cannot be negative")
    Integer orderIndex
) {}
