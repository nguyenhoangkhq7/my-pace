package nhk.task;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record TaskUpdateRequest(
    @NotBlank(message = "Title is required")
    String title,
    UUID goalId,
    UUID categoryId,
    Integer estimatedMinutes,
    Integer actualMinutes,
    Boolean isUrgent,
    Boolean isImportant,
    Boolean isSplittable,
    Integer minChunkMinutes,
    Integer maxDailyDuration,
    String status,
    LocalDateTime dueDate,
    String notes,
    List<TaskChecklistItemRequest> checklists
) {}
