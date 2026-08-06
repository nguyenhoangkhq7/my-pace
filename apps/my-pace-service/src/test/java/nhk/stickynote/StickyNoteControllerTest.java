package nhk.stickynote;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.persistence.EntityNotFoundException;
import nhk.common.GlobalExceptionHandler;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserDetailsCustom;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class StickyNoteControllerTest {

    @Mock
    private StickyNoteService stickyNoteService;

    @InjectMocks
    private StickyNoteController stickyNoteController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private UUID userId;
    private UUID noteId;
    private StickyNoteDto sampleNoteDto;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        noteId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setEmail("user@example.com");
        user.setRole(Role.USER);

        UserDetailsCustom userDetailsCustom = new UserDetailsCustom(user);

        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                        || parameter.getParameterType().equals(UserDetailsCustom.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return userDetailsCustom;
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(stickyNoteController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        sampleNoteDto = new StickyNoteDto(
                noteId,
                userId,
                "Sample Title",
                "Sample Content",
                "amber",
                false,
                false,
                true,
                120,
                120,
                280,
                280,
                1,
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );
    }

    @Nested
    @DisplayName("GET /api/sticky-notes")
    class GetStickyNotesTests {

        @Test
        @DisplayName("Should return 200 OK and list of sticky notes")
        void getStickyNotes_Success() throws Exception {
            when(stickyNoteService.getStickyNotes(userId)).thenReturn(List.of(sampleNoteDto));

            mockMvc.perform(get("/api/sticky-notes"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].id", is(noteId.toString())))
                    .andExpect(jsonPath("$[0].userId", is(userId.toString())))
                    .andExpect(jsonPath("$[0].title", is("Sample Title")))
                    .andExpect(jsonPath("$[0].content", is("Sample Content")))
                    .andExpect(jsonPath("$[0].color", is("amber")));

            verify(stickyNoteService, times(1)).getStickyNotes(userId);
        }

        @Test
        @DisplayName("Should return 200 OK and empty array when no notes exist")
        void getStickyNotes_EmptyList() throws Exception {
            when(stickyNoteService.getStickyNotes(userId)).thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/sticky-notes"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));

            verify(stickyNoteService, times(1)).getStickyNotes(userId);
        }
    }

    @Nested
    @DisplayName("POST /api/sticky-notes")
    class CreateStickyNoteTests {

        @Test
        @DisplayName("Should return 201 Created and created note when request is valid")
        void createStickyNote_Success() throws Exception {
            StickyNoteCreateRequest request = new StickyNoteCreateRequest(
                    "New Title",
                    "New Content",
                    "blue",
                    false,
                    false,
                    true,
                    150,
                    150,
                    300,
                    300,
                    2
            );

            when(stickyNoteService.createStickyNote(any(StickyNoteCreateRequest.class), eq(userId)))
                    .thenReturn(sampleNoteDto);

            mockMvc.perform(post("/api/sticky-notes")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id", is(noteId.toString())))
                    .andExpect(jsonPath("$.title", is("Sample Title")));

            verify(stickyNoteService, times(1)).createStickyNote(any(StickyNoteCreateRequest.class), eq(userId));
        }
    }

    @Nested
    @DisplayName("PUT /api/sticky-notes/{id}")
    class UpdateStickyNoteTests {

        @Test
        @DisplayName("Should return 200 OK and updated note when update is successful")
        void updateStickyNote_Success() throws Exception {
            StickyNoteUpdateRequest request = new StickyNoteUpdateRequest(
                    "Updated Title",
                    "Updated Content",
                    "green",
                    true,
                    false,
                    true,
                    200,
                    200,
                    350,
                    350,
                    5
            );

            when(stickyNoteService.updateStickyNote(eq(noteId), any(StickyNoteUpdateRequest.class), eq(userId)))
                    .thenReturn(sampleNoteDto);

            mockMvc.perform(put("/api/sticky-notes/{id}", noteId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(noteId.toString())));

            verify(stickyNoteService, times(1)).updateStickyNote(eq(noteId), any(StickyNoteUpdateRequest.class), eq(userId));
        }

        @Test
        @DisplayName("Should return 404 Not Found when note to update does not exist or belong to user")
        void updateStickyNote_NotFound() throws Exception {
            StickyNoteUpdateRequest request = new StickyNoteUpdateRequest(
                    "Title", null, null, null, null, null, null, null, null, null, null
            );

            when(stickyNoteService.updateStickyNote(eq(noteId), any(StickyNoteUpdateRequest.class), eq(userId)))
                    .thenThrow(new EntityNotFoundException("Sticky note not found"));

            mockMvc.perform(put("/api/sticky-notes/{id}", noteId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message", is("Sticky note not found")));

            verify(stickyNoteService, times(1)).updateStickyNote(eq(noteId), any(StickyNoteUpdateRequest.class), eq(userId));
        }
    }

    @Nested
    @DisplayName("DELETE /api/sticky-notes/{id}")
    class DeleteStickyNoteTests {

        @Test
        @DisplayName("Should return 204 No Content when note is deleted successfully")
        void deleteStickyNote_Success() throws Exception {
            doNothing().when(stickyNoteService).deleteStickyNote(noteId, userId);

            mockMvc.perform(delete("/api/sticky-notes/{id}", noteId))
                    .andExpect(status().isNoContent());

            verify(stickyNoteService, times(1)).deleteStickyNote(noteId, userId);
        }

        @Test
        @DisplayName("Should return 404 Not Found when note to delete does not exist or belong to user")
        void deleteStickyNote_NotFound() throws Exception {
            doThrow(new EntityNotFoundException("Sticky note not found"))
                    .when(stickyNoteService).deleteStickyNote(noteId, userId);

            mockMvc.perform(delete("/api/sticky-notes/{id}", noteId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message", is("Sticky note not found")));

            verify(stickyNoteService, times(1)).deleteStickyNote(noteId, userId);
        }
    }
}
