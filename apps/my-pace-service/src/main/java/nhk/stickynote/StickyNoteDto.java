package nhk.stickynote;

import java.time.OffsetDateTime;
import java.util.UUID;

public record StickyNoteDto(
        UUID id,
        UUID userId,
        String title,
        String content,
        String color,
        Boolean isPinned,
        Boolean isMinimized,
        Boolean isVisible,
        Integer positionX,
        Integer positionY,
        Integer width,
        Integer height,
        Integer zIndex,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
