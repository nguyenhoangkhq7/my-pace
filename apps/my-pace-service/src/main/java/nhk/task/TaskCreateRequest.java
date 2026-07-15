package nhk.task;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record TaskCreateRequest(
    @NotBlank(message = "Title is required")
    String title,
    UUID goalId,
    UUID categoryId,
    Integer estimatedMinutes,
    Boolean isUrgent,
    Boolean isImportant,
    LocalDateTime dueDate,
    String status,
    String notes,
    List<TaskChecklistItemRequest> checklists
) {}
