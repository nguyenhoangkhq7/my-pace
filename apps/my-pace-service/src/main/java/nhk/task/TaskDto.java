package nhk.task;

import lombok.Builder;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Builder(toBuilder = true)
public record TaskDto(
    UUID id,
    UUID userId,
    UUID goalId,
    UUID categoryId,
    nhk.category.CategoryDto category,
    String title,
    Integer estimatedMinutes,
    Integer actualMinutes,
    Boolean isUrgent,
    Boolean isImportant,
    String status,
    LocalDateTime dueDate,
    String notes,
    OffsetDateTime doneAt,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    List<TaskChecklistItemDto> checklists
) {}
