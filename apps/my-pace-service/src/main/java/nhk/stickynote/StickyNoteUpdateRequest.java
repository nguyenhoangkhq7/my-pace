package nhk.stickynote;

public record StickyNoteUpdateRequest(
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
        Integer zIndex
) {}
