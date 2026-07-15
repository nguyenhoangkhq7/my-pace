package nhk.task;

import lombok.Builder;

import java.time.OffsetDateTime;
import java.util.UUID;

@Builder
public record TaskChecklistItemDto(
    UUID id,
    UUID taskId,
    String title,
    Boolean isCompleted,
    Integer orderIndex,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
