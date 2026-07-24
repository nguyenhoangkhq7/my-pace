package nhk.stickynote;

import java.util.List;
import java.util.UUID;

public interface StickyNoteService {
    List<StickyNoteDto> getStickyNotes(UUID userId);
    StickyNoteDto createStickyNote(StickyNoteCreateRequest request, UUID userId);
    StickyNoteDto updateStickyNote(UUID noteId, StickyNoteUpdateRequest request, UUID userId);
    void deleteStickyNote(UUID noteId, UUID userId);
}
