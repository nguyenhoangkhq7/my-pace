package nhk.stickynote;

import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StickyNoteServiceImplTest {

    @Mock
    private StickyNoteRepository stickyNoteRepository;

    @InjectMocks
    private StickyNoteServiceImpl stickyNoteService;

    private UUID userId;
    private UUID noteId;
    private StickyNote sampleNote;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        noteId = UUID.randomUUID();

        sampleNote = new StickyNote();
        sampleNote.setId(noteId);
        sampleNote.setUserId(userId);
        sampleNote.setTitle("Sample Note");
        sampleNote.setContent("Sample Content");
        sampleNote.setColor("yellow");
        sampleNote.setIsPinned(true);
        sampleNote.setIsMinimized(false);
        sampleNote.setIsVisible(true);
        sampleNote.setPositionX(150);
        sampleNote.setPositionY(200);
        sampleNote.setWidth(300);
        sampleNote.setHeight(300);
        sampleNote.setZIndex(5);
        sampleNote.setCreatedAt(OffsetDateTime.now());
        sampleNote.setUpdatedAt(OffsetDateTime.now());
    }

    @Nested
    @DisplayName("getStickyNotes Tests")
    class GetStickyNotesTests {

        @Test
        @DisplayName("Should return list of StickyNoteDto when notes exist for user")
        void getStickyNotes_Success() {
            when(stickyNoteRepository.findByUserIdOrderByUpdatedAtDesc(userId))
                    .thenReturn(List.of(sampleNote));

            List<StickyNoteDto> result = stickyNoteService.getStickyNotes(userId);

            assertNotNull(result);
            assertEquals(1, result.size());
            StickyNoteDto dto = result.get(0);
            assertEquals(sampleNote.getId(), dto.id());
            assertEquals(sampleNote.getUserId(), dto.userId());
            assertEquals("Sample Note", dto.title());
            assertEquals("Sample Content", dto.content());
            assertEquals("yellow", dto.color());
            assertTrue(dto.isPinned());
            assertFalse(dto.isMinimized());
            assertTrue(dto.isVisible());
            assertEquals(150, dto.positionX());
            assertEquals(200, dto.positionY());
            assertEquals(300, dto.width());
            assertEquals(300, dto.height());
            assertEquals(5, dto.zIndex());

            verify(stickyNoteRepository, times(1)).findByUserIdOrderByUpdatedAtDesc(userId);
        }

        @Test
        @DisplayName("Should return empty list when no notes found for user")
        void getStickyNotes_Empty() {
            when(stickyNoteRepository.findByUserIdOrderByUpdatedAtDesc(userId))
                    .thenReturn(Collections.emptyList());

            List<StickyNoteDto> result = stickyNoteService.getStickyNotes(userId);

            assertNotNull(result);
            assertTrue(result.isEmpty());
            verify(stickyNoteRepository, times(1)).findByUserIdOrderByUpdatedAtDesc(userId);
        }
    }

    @Nested
    @DisplayName("createStickyNote Tests")
    class CreateStickyNoteTests {

        @Test
        @DisplayName("Should create sticky note with custom request values when provided")
        void createStickyNote_Success_FullRequest() {
            StickyNoteCreateRequest request = new StickyNoteCreateRequest(
                    "Meeting Notes",
                    "Discuss Q3 goals",
                    "blue",
                    true,
                    true,
                    false,
                    200,
                    250,
                    400,
                    350,
                    10
            );

            when(stickyNoteRepository.save(any(StickyNote.class))).thenAnswer(invocation -> {
                StickyNote note = invocation.getArgument(0);
                note.setId(noteId);
                note.setCreatedAt(OffsetDateTime.now());
                note.setUpdatedAt(OffsetDateTime.now());
                return note;
            });

            StickyNoteDto result = stickyNoteService.createStickyNote(request, userId);

            assertNotNull(result);
            assertEquals(noteId, result.id());
            assertEquals(userId, result.userId());
            assertEquals("Meeting Notes", result.title());
            assertEquals("Discuss Q3 goals", result.content());
            assertEquals("blue", result.color());
            assertTrue(result.isPinned());
            assertTrue(result.isMinimized());
            assertFalse(result.isVisible());
            assertEquals(200, result.positionX());
            assertEquals(250, result.positionY());
            assertEquals(400, result.width());
            assertEquals(350, result.height());
            assertEquals(10, result.zIndex());

            ArgumentCaptor<StickyNote> captor = ArgumentCaptor.forClass(StickyNote.class);
            verify(stickyNoteRepository, times(1)).save(captor.capture());
            StickyNote savedEntity = captor.getValue();
            assertEquals(userId, savedEntity.getUserId());
            assertEquals("Meeting Notes", savedEntity.getTitle());
            assertEquals("Discuss Q3 goals", savedEntity.getContent());
            assertEquals("blue", savedEntity.getColor());
        }

        @Test
        @DisplayName("Should create sticky note with default entity values when request fields are null")
        void createStickyNote_Success_NullFields_UseDefaults() {
            StickyNoteCreateRequest request = new StickyNoteCreateRequest(
                    null, null, null, null, null, null, null, null, null, null, null
            );

            when(stickyNoteRepository.save(any(StickyNote.class))).thenAnswer(invocation -> {
                StickyNote note = invocation.getArgument(0);
                note.setId(noteId);
                return note;
            });

            StickyNoteDto result = stickyNoteService.createStickyNote(request, userId);

            assertNotNull(result);
            assertEquals("Untitled Note", result.title());
            assertEquals("", result.content());
            assertEquals("amber", result.color());
            assertFalse(result.isPinned());
            assertFalse(result.isMinimized());
            assertTrue(result.isVisible());
            assertEquals(120, result.positionX());
            assertEquals(120, result.positionY());
            assertEquals(280, result.width());
            assertEquals(280, result.height());
            assertEquals(1, result.zIndex());

            verify(stickyNoteRepository, times(1)).save(any(StickyNote.class));
        }

        @Test
        @DisplayName("Should use entity default title and color when request contains blank strings")
        void createStickyNote_Success_BlankTitleAndColor_UseDefaults() {
            StickyNoteCreateRequest request = new StickyNoteCreateRequest(
                    "   ",
                    "Content",
                    "  ",
                    null, null, null, null, null, null, null, null
            );

            when(stickyNoteRepository.save(any(StickyNote.class))).thenAnswer(invocation -> {
                StickyNote note = invocation.getArgument(0);
                note.setId(noteId);
                return note;
            });

            StickyNoteDto result = stickyNoteService.createStickyNote(request, userId);

            assertNotNull(result);
            assertEquals("Untitled Note", result.title());
            assertEquals("Content", result.content());
            assertEquals("amber", result.color());

            verify(stickyNoteRepository, times(1)).save(any(StickyNote.class));
        }
    }

    @Nested
    @DisplayName("updateStickyNote Tests")
    class UpdateStickyNoteTests {

        @Test
        @DisplayName("Should update all fields of sticky note when requested")
        void updateStickyNote_Success_AllFields() {
            StickyNoteUpdateRequest request = new StickyNoteUpdateRequest(
                    "Updated Title",
                    "Updated Content",
                    "green",
                    false,
                    true,
                    true,
                    300,
                    400,
                    500,
                    450,
                    20
            );

            when(stickyNoteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));
            when(stickyNoteRepository.save(any(StickyNote.class))).thenAnswer(invocation -> invocation.getArgument(0));

            StickyNoteDto result = stickyNoteService.updateStickyNote(noteId, request, userId);

            assertNotNull(result);
            assertEquals("Updated Title", result.title());
            assertEquals("Updated Content", result.content());
            assertEquals("green", result.color());
            assertFalse(result.isPinned());
            assertTrue(result.isMinimized());
            assertTrue(result.isVisible());
            assertEquals(300, result.positionX());
            assertEquals(400, result.positionY());
            assertEquals(500, result.width());
            assertEquals(450, result.height());
            assertEquals(20, result.zIndex());

            verify(stickyNoteRepository, times(1)).findById(noteId);
            verify(stickyNoteRepository, times(1)).save(sampleNote);
        }

        @Test
        @DisplayName("Should partially update sticky note when only some fields are provided in request")
        void updateStickyNote_Success_PartialFields() {
            StickyNoteUpdateRequest request = new StickyNoteUpdateRequest(
                    "New Title Only",
                    null,
                    null,
                    null,
                    null,
                    null,
                    500,
                    null,
                    null,
                    null,
                    null
            );

            when(stickyNoteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));
            when(stickyNoteRepository.save(any(StickyNote.class))).thenAnswer(invocation -> invocation.getArgument(0));

            StickyNoteDto result = stickyNoteService.updateStickyNote(noteId, request, userId);

            assertNotNull(result);
            assertEquals("New Title Only", result.title());
            assertEquals("Sample Content", result.content()); // unchanged
            assertEquals("yellow", result.color()); // unchanged
            assertEquals(500, result.positionX()); // updated
            assertEquals(200, result.positionY()); // unchanged

            verify(stickyNoteRepository, times(1)).save(sampleNote);
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when note does not exist")
        void updateStickyNote_NotFound_WhenNoteDoesNotExist() {
            StickyNoteUpdateRequest request = new StickyNoteUpdateRequest(
                    "Title", null, null, null, null, null, null, null, null, null, null
            );

            when(stickyNoteRepository.findById(noteId)).thenReturn(Optional.empty());

            EntityNotFoundException ex = assertThrows(
                    EntityNotFoundException.class,
                    () -> stickyNoteService.updateStickyNote(noteId, request, userId)
            );

            assertEquals("Sticky note not found", ex.getMessage());
            verify(stickyNoteRepository, times(1)).findById(noteId);
            verify(stickyNoteRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when note belongs to another user")
        void updateStickyNote_NotFound_WhenNoteBelongsToAnotherUser() {
            UUID otherUserId = UUID.randomUUID();
            sampleNote.setUserId(otherUserId);

            StickyNoteUpdateRequest request = new StickyNoteUpdateRequest(
                    "Title", null, null, null, null, null, null, null, null, null, null
            );

            when(stickyNoteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));

            EntityNotFoundException ex = assertThrows(
                    EntityNotFoundException.class,
                    () -> stickyNoteService.updateStickyNote(noteId, request, userId)
            );

            assertEquals("Sticky note not found", ex.getMessage());
            verify(stickyNoteRepository, times(1)).findById(noteId);
            verify(stickyNoteRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("deleteStickyNote Tests")
    class DeleteStickyNoteTests {

        @Test
        @DisplayName("Should delete sticky note successfully when note exists and belongs to user")
        void deleteStickyNote_Success() {
            when(stickyNoteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));
            doNothing().when(stickyNoteRepository).delete(sampleNote);

            assertDoesNotThrow(() -> stickyNoteService.deleteStickyNote(noteId, userId));

            verify(stickyNoteRepository, times(1)).findById(noteId);
            verify(stickyNoteRepository, times(1)).delete(sampleNote);
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when deleting non-existing note")
        void deleteStickyNote_NotFound_WhenNoteDoesNotExist() {
            when(stickyNoteRepository.findById(noteId)).thenReturn(Optional.empty());

            EntityNotFoundException ex = assertThrows(
                    EntityNotFoundException.class,
                    () -> stickyNoteService.deleteStickyNote(noteId, userId)
            );

            assertEquals("Sticky note not found", ex.getMessage());
            verify(stickyNoteRepository, times(1)).findById(noteId);
            verify(stickyNoteRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when deleting note belonging to another user")
        void deleteStickyNote_NotFound_WhenNoteBelongsToAnotherUser() {
            UUID otherUserId = UUID.randomUUID();
            sampleNote.setUserId(otherUserId);

            when(stickyNoteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));

            EntityNotFoundException ex = assertThrows(
                    EntityNotFoundException.class,
                    () -> stickyNoteService.deleteStickyNote(noteId, userId)
            );

            assertEquals("Sticky note not found", ex.getMessage());
            verify(stickyNoteRepository, times(1)).findById(noteId);
            verify(stickyNoteRepository, never()).delete(any());
        }
    }
}
