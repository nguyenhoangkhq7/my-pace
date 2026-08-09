package nhk.stickynote;

import nhk.BaseIntegrationTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import nhk.common.GlobalExceptionHandler;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserDetailsCustom;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class StickyNoteIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private StickyNoteController stickyNoteController;

    @Autowired
    private StickyNoteRepository stickyNoteRepository;

    @Autowired
    private nhk.user.UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private MockMvc mockMvcUser1;
    private MockMvc mockMvcUser2;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        stickyNoteRepository.deleteAll();

        user1 = new User();
        user1.setEmail("user1_" + UUID.randomUUID() + "@example.com");
        user1.setPasswordHash("hashedpassword");
        user1.setFullName("User One");
        user1.setRole(Role.USER);
        user1 = userRepository.save(user1);

        user2 = new User();
        user2.setEmail("user2_" + UUID.randomUUID() + "@example.com");
        user2.setPasswordHash("hashedpassword");
        user2.setFullName("User Two");
        user2.setRole(Role.USER);
        user2 = userRepository.save(user2);

        UserDetailsCustom userDetails1 = new UserDetailsCustom(user1);
        UserDetailsCustom userDetails2 = new UserDetailsCustom(user2);

        mockMvcUser1 = buildMockMvcForUser(userDetails1);
        mockMvcUser2 = buildMockMvcForUser(userDetails2);
    }

    private MockMvc buildMockMvcForUser(UserDetailsCustom userDetails) {
        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                        || parameter.getParameterType().equals(UserDetailsCustom.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return userDetails;
            }
        };

        return MockMvcBuilders.standaloneSetup(stickyNoteController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Nested
    @DisplayName("Create & Read Integration Flow")
    class CreateAndReadFlow {

        @Test
        @DisplayName("Should create note via HTTP POST and retrieve it via HTTP GET")
        void createAndRetrieveStickyNote_Success() throws Exception {
            StickyNoteCreateRequest createRequest = new StickyNoteCreateRequest(
                    "Sprint Plan",
                    "Complete integration tests",
                    "purple",
                    true,
                    false,
                    true,
                    100,
                    200,
                    300,
                    400,
                    5
            );

            // 1. Create Sticky Note via HTTP POST
            String responseString = mockMvcUser1.perform(post("/api/sticky-notes")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.title", is("Sprint Plan")))
                    .andExpect(jsonPath("$.content", is("Complete integration tests")))
                    .andExpect(jsonPath("$.color", is("purple")))
                    .andExpect(jsonPath("$.isPinned", is(true)))
                    .andExpect(jsonPath("$.isMinimized", is(false)))
                    .andExpect(jsonPath("$.isVisible", is(true)))
                    .andExpect(jsonPath("$.positionX", is(100)))
                    .andExpect(jsonPath("$.positionY", is(200)))
                    .andExpect(jsonPath("$.width", is(300)))
                    .andExpect(jsonPath("$.height", is(400)))
                    .andExpect(jsonPath("$.zIndex", is(5)))
                    .andReturn().getResponse().getContentAsString();

            StickyNoteDto createdDto = objectMapper.readValue(responseString, StickyNoteDto.class);
            assertNotNull(createdDto.id());

            // 2. Verify Database Persistence
            List<StickyNote> dbNotes = stickyNoteRepository.findByUserIdOrderByUpdatedAtDesc(user1.getId());
            assertEquals(1, dbNotes.size());
            assertEquals("Sprint Plan", dbNotes.get(0).getTitle());
            assertEquals("Complete integration tests", dbNotes.get(0).getContent());

            // 3. Retrieve Sticky Notes via HTTP GET
            mockMvcUser1.perform(get("/api/sticky-notes"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].id", is(createdDto.id().toString())))
                    .andExpect(jsonPath("$[0].title", is("Sprint Plan")));
        }

        @Test
        @DisplayName("Should create note with entity default values when request body fields are null")
        void createStickyNote_WithDefaults_Success() throws Exception {
            StickyNoteCreateRequest emptyRequest = new StickyNoteCreateRequest(
                    null, null, null, null, null, null, null, null, null, null, null
            );

            mockMvcUser1.perform(post("/api/sticky-notes")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(emptyRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.title", is("Untitled Note")))
                    .andExpect(jsonPath("$.content", is("")))
                    .andExpect(jsonPath("$.color", is("amber")))
                    .andExpect(jsonPath("$.isPinned", is(false)))
                    .andExpect(jsonPath("$.isMinimized", is(false)))
                    .andExpect(jsonPath("$.isVisible", is(true)))
                    .andExpect(jsonPath("$.positionX", is(120)))
                    .andExpect(jsonPath("$.positionY", is(120)))
                    .andExpect(jsonPath("$.width", is(280)))
                    .andExpect(jsonPath("$.height", is(280)))
                    .andExpect(jsonPath("$.zIndex", is(1)));
        }
    }

    @Nested
    @DisplayName("Update Integration Flow")
    class UpdateFlow {

        @Test
        @DisplayName("Should update full and partial fields of an existing note in Database")
        void updateStickyNote_FullAndPartial_Success() throws Exception {
            // 1. Create Note in DB
            StickyNote note = new StickyNote();
            note.setUserId(user1.getId());
            note.setTitle("Original Title");
            note.setContent("Original Content");
            note.setColor("amber");
            note.setPositionX(120);
            note.setPositionY(120);
            StickyNote savedNote = stickyNoteRepository.save(note);

            // 2. Full Update via HTTP PUT
            StickyNoteUpdateRequest fullUpdate = new StickyNoteUpdateRequest(
                    "Updated Title",
                    "Updated Content",
                    "green",
                    true,
                    true,
                    true,
                    250,
                    350,
                    400,
                    400,
                    10
            );

            mockMvcUser1.perform(put("/api/sticky-notes/{id}", savedNote.getId())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(fullUpdate)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title", is("Updated Title")))
                    .andExpect(jsonPath("$.content", is("Updated Content")))
                    .andExpect(jsonPath("$.color", is("green")))
                    .andExpect(jsonPath("$.isPinned", is(true)))
                    .andExpect(jsonPath("$.positionX", is(250)))
                    .andExpect(jsonPath("$.positionY", is(350)));

            // 3. Partial Update via HTTP PUT (only positionX & positionY)
            StickyNoteUpdateRequest partialUpdate = new StickyNoteUpdateRequest(
                    null, null, null, null, null, null, 500, 600, null, null, null
            );

            mockMvcUser1.perform(put("/api/sticky-notes/{id}", savedNote.getId())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(partialUpdate)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title", is("Updated Title"))) // retained
                    .andExpect(jsonPath("$.content", is("Updated Content"))) // retained
                    .andExpect(jsonPath("$.positionX", is(500))) // updated
                    .andExpect(jsonPath("$.positionY", is(600))); // updated

            // Verify in DB
            StickyNote dbNote = stickyNoteRepository.findById(savedNote.getId()).orElseThrow();
            assertEquals("Updated Title", dbNote.getTitle());
            assertEquals(500, dbNote.getPositionX());
            assertEquals(600, dbNote.getPositionY());
        }

        @Test
        @DisplayName("Should return 404 Not Found when updating non-existent note")
        void updateStickyNote_NotFound() throws Exception {
            UUID randomId = UUID.randomUUID();
            StickyNoteUpdateRequest updateRequest = new StickyNoteUpdateRequest(
                    "Title", null, null, null, null, null, null, null, null, null, null
            );

            mockMvcUser1.perform(put("/api/sticky-notes/{id}", randomId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message", is("Sticky note not found")));
        }
    }

    @Nested
    @DisplayName("Delete Integration Flow")
    class DeleteFlow {

        @Test
        @DisplayName("Should delete sticky note via HTTP DELETE and remove it from Database")
        void deleteStickyNote_Success() throws Exception {
            StickyNote note = new StickyNote();
            note.setUserId(user1.getId());
            note.setTitle("Note to Delete");
            StickyNote savedNote = stickyNoteRepository.save(note);

            mockMvcUser1.perform(delete("/api/sticky-notes/{id}", savedNote.getId()))
                    .andExpect(status().isNoContent());

            assertTrue(stickyNoteRepository.findById(savedNote.getId()).isEmpty());

            mockMvcUser1.perform(get("/api/sticky-notes"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));
        }

        @Test
        @DisplayName("Should return 404 Not Found when deleting non-existent note")
        void deleteStickyNote_NotFound() throws Exception {
            UUID randomId = UUID.randomUUID();

            mockMvcUser1.perform(delete("/api/sticky-notes/{id}", randomId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message", is("Sticky note not found")));
        }
    }

    @Nested
    @DisplayName("Multi-User Data Isolation Integration Flow")
    class UserDataIsolationFlow {

        @Test
        @DisplayName("User2 cannot view, update, or delete User1's sticky notes")
        void userDataIsolation_Enforced() throws Exception {
            // User 1 creates a note
            StickyNote note1 = new StickyNote();
            note1.setUserId(user1.getId());
            note1.setTitle("User 1 Secret Note");
            note1.setContent("Private data");
            StickyNote savedNote1 = stickyNoteRepository.save(note1);

            // User 2 GET -> should not see User 1's note
            mockMvcUser2.perform(get("/api/sticky-notes"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));

            // User 2 PUT -> should get 404 Not Found
            StickyNoteUpdateRequest hackUpdate = new StickyNoteUpdateRequest(
                    "Hacked Title", "Hacked Content", null, null, null, null, null, null, null, null, null
            );
            mockMvcUser2.perform(put("/api/sticky-notes/{id}", savedNote1.getId())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(hackUpdate)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message", is("Sticky note not found")));

            // User 2 DELETE -> should get 404 Not Found
            mockMvcUser2.perform(delete("/api/sticky-notes/{id}", savedNote1.getId()))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message", is("Sticky note not found")));

            // Verify User 1's note remains untouched in DB
            StickyNote dbNote1 = stickyNoteRepository.findById(savedNote1.getId()).orElseThrow();
            assertEquals("User 1 Secret Note", dbNote1.getTitle());
            assertEquals("Private data", dbNote1.getContent());
        }
    }
}
