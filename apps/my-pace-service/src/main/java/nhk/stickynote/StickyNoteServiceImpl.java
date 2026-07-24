package nhk.stickynote;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StickyNoteServiceImpl implements StickyNoteService {
    private final StickyNoteRepository stickyNoteRepository;

    private StickyNoteDto toDto(StickyNote note) {
        return new StickyNoteDto(
                note.getId(),
                note.getUserId(),
                note.getTitle(),
                note.getContent(),
                note.getColor(),
                note.getIsPinned(),
                note.getIsMinimized(),
                note.getIsVisible(),
                note.getPositionX(),
                note.getPositionY(),
                note.getWidth(),
                note.getHeight(),
                note.getZIndex(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<StickyNoteDto> getStickyNotes(UUID userId) {
        return stickyNoteRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StickyNoteDto createStickyNote(StickyNoteCreateRequest request, UUID userId) {
        StickyNote note = new StickyNote();
        note.setUserId(userId);
        if (request.title() != null && !request.title().isBlank()) note.setTitle(request.title());
        if (request.content() != null) note.setContent(request.content());
        if (request.color() != null && !request.color().isBlank()) note.setColor(request.color());
        if (request.isPinned() != null) note.setIsPinned(request.isPinned());
        if (request.isMinimized() != null) note.setIsMinimized(request.isMinimized());
        if (request.isVisible() != null) note.setIsVisible(request.isVisible());
        if (request.positionX() != null) note.setPositionX(request.positionX());
        if (request.positionY() != null) note.setPositionY(request.positionY());
        if (request.width() != null) note.setWidth(request.width());
        if (request.height() != null) note.setHeight(request.height());
        if (request.zIndex() != null) note.setZIndex(request.zIndex());

        StickyNote saved = stickyNoteRepository.save(note);
        return toDto(saved);
    }

    @Override
    @Transactional
    public StickyNoteDto updateStickyNote(UUID noteId, StickyNoteUpdateRequest request, UUID userId) {
        StickyNote note = stickyNoteRepository.findById(noteId)
                .filter(n -> n.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Sticky note not found"));

        if (request.title() != null) note.setTitle(request.title());
        if (request.content() != null) note.setContent(request.content());
        if (request.color() != null) note.setColor(request.color());
        if (request.isPinned() != null) note.setIsPinned(request.isPinned());
        if (request.isMinimized() != null) note.setIsMinimized(request.isMinimized());
        if (request.isVisible() != null) note.setIsVisible(request.isVisible());
        if (request.positionX() != null) note.setPositionX(request.positionX());
        if (request.positionY() != null) note.setPositionY(request.positionY());
        if (request.width() != null) note.setWidth(request.width());
        if (request.height() != null) note.setHeight(request.height());
        if (request.zIndex() != null) note.setZIndex(request.zIndex());

        StickyNote saved = stickyNoteRepository.save(note);
        return toDto(saved);
    }

    @Override
    @Transactional
    public void deleteStickyNote(UUID noteId, UUID userId) {
        StickyNote note = stickyNoteRepository.findById(noteId)
                .filter(n -> n.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Sticky note not found"));
        stickyNoteRepository.delete(note);
    }
}
