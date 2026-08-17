package nhk.task;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record TaskCreateRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    String title,
    UUID goalId,
    UUID categoryId,
    @Min(value = 1, message = "Estimated minutes must be at least 1")
    @Max(value = 1440, message = "Estimated minutes cannot exceed 1440 (24 hours)")
    Integer estimatedMinutes,
    Boolean isUrgent,
    Boolean isImportant,
    Boolean isSplittable,
    @Min(value = 15, message = "Minimum chunk minutes must be at least 15")
    @Max(value = 1440, message = "Minimum chunk minutes cannot exceed 1440")
    Integer minChunkMinutes,
    @Min(value = 15, message = "Maximum daily duration must be at least 15")
    @Max(value = 720, message = "Maximum daily duration cannot exceed 720 minutes (12 hours)")
    Integer maxDailyDuration,
    LocalDateTime dueDate,
    String status,
    @Size(max = 5000, message = "Notes cannot exceed 5000 characters")
    String notes,
    @Size(max = 50, message = "Cannot exceed 50 checklist items per task")
    List<@Valid TaskChecklistItemRequest> checklists
) {}
