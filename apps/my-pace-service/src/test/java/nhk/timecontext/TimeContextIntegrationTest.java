package nhk.timecontext;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import nhk.category.Category;
import nhk.category.CategoryRepository;
import nhk.common.GlobalExceptionHandler;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserDetailsCustom;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import jakarta.persistence.EntityManager;

@SpringBootTest
@Transactional
@TestPropertySource(properties = {
    "RESEND_API_KEY=test-api-key",
    "JWT_SECRET=test-jwt-secret-with-at-least-256-bits-length-so-it-does-not-fail-validation"
})
class TimeContextIntegrationTest {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private TimeContextController timeContextController;

    @Autowired
    private TimeContextRepository timeContextRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    private ObjectMapper objectMapper;

    private MockMvc mockMvcUser1;
    private MockMvc mockMvcUser2;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        user1 = new User();
        user1.setEmail("user1@example.com");
        user1.setPasswordHash("hashedpassword");
        user1.setFullName("User One");
        user1.setRole(Role.USER);
        user1 = userRepository.save(user1);

        user2 = new User();
        user2.setEmail("user2@example.com");
        user2.setPasswordHash("hashedpassword");
        user2.setFullName("User Two");
        user2.setRole(Role.USER);
        user2 = userRepository.save(user2);

        mockMvcUser1 = buildMockMvcForUser(new UserDetailsCustom(user1));
        mockMvcUser2 = buildMockMvcForUser(new UserDetailsCustom(user2));
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

        return MockMvcBuilders.standaloneSetup(timeContextController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Nested
    @DisplayName("Create & Read Integration Flow")
    class CreateAndReadFlow {

        @Test
        @DisplayName("Should create TimeContext with slots & categories, persist to DB, and retrieve via HTTP GET")
        void createAndRetrieveTimeContext_Success() throws Exception {
            // 1. Create a category in DB for user1
            Category category = new Category();
            category.setUserId(user1.getId());
            category.setName("Deep Work");
            category.setColor("#3b82f6");
            Category savedCat = categoryRepository.save(category);

            // 2. Prepare TimeContextCreateRequest
            TimeContextSlotDto slot = new TimeContextSlotDto(null, DayOfWeek.MONDAY, LocalTime.of(8, 0), LocalTime.of(12, 0));
            TimeContextCreateRequest createRequest = new TimeContextCreateRequest(
                    "Morning Deep Work",
                    List.of(slot),
                    List.of(savedCat.getId())
            );

            // 3. Perform POST /api/time-contexts
            String responseStr = mockMvcUser1.perform(post("/api/time-contexts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.name", is("Morning Deep Work")))
                    .andExpect(jsonPath("$.slots", hasSize(1)))
                    .andExpect(jsonPath("$.slots[0].dayOfWeek", is("MONDAY")))
                    .andReturn().getResponse().getContentAsString();

            TimeContextDto createdDto = objectMapper.readValue(responseStr, TimeContextDto.class);
            assertNotNull(createdDto.id());

            // 4. Verify Database Persistence
            TimeContext dbContext = timeContextRepository.findById(createdDto.id()).orElseThrow();
            assertEquals("Morning Deep Work", dbContext.getName());
            assertEquals(user1.getId(), dbContext.getUserId());
            assertEquals(1, dbContext.getSlots().size());
            assertEquals(DayOfWeek.MONDAY, dbContext.getSlots().get(0).getDayOfWeek());

            Category updatedCat = categoryRepository.findById(savedCat.getId()).orElseThrow();
            assertNotNull(updatedCat.getTimeContext());
            assertEquals(createdDto.id(), updatedCat.getTimeContext().getId());

            // 5. Perform GET /api/time-contexts
            mockMvcUser1.perform(get("/api/time-contexts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].id", is(createdDto.id().toString())))
                    .andExpect(jsonPath("$[0].name", is("Morning Deep Work")));

            // 6. Perform GET /api/time-contexts/{id}
            mockMvcUser1.perform(get("/api/time-contexts/{id}", createdDto.id()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(createdDto.id().toString())))
                    .andExpect(jsonPath("$.name", is("Morning Deep Work")));
        }

        @Test
        @DisplayName("Should return 400 Bad Request when request body is invalid (blank name)")
        void createTimeContext_InvalidName_Returns400() throws Exception {
            TimeContextCreateRequest invalidRequest = new TimeContextCreateRequest("", Collections.emptyList(), Collections.emptyList());

            mockMvcUser1.perform(post("/api/time-contexts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidRequest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", is("Dữ liệu đầu vào không hợp lệ")));
        }

        @Test
        @DisplayName("Should return 400 Bad Request when slot start time is not before end time")
        void createTimeContext_InvalidSlotTime_Returns400() throws Exception {
            TimeContextSlotDto invalidSlot = new TimeContextSlotDto(null, DayOfWeek.MONDAY, LocalTime.of(14, 0), LocalTime.of(10, 0));
            TimeContextCreateRequest request = new TimeContextCreateRequest("Invalid Slot", List.of(invalidSlot), Collections.emptyList());

            mockMvcUser1.perform(post("/api/time-contexts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", is("Start time must be before end time for time slot")));
        }

        @Test
        @DisplayName("Should return 404 Not Found when getting non-existent time context")
        void getTimeContext_NotFound() throws Exception {
            UUID randomId = UUID.randomUUID();

            mockMvcUser1.perform(get("/api/time-contexts/{id}", randomId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message", is("Time Context not found with ID: " + randomId)));
        }
    }

    @Nested
    @DisplayName("Update Integration Flow")
    class UpdateFlow {

        @Test
        @DisplayName("Should update TimeContext name, slots and categories in Database")
        void updateTimeContext_Success() throws Exception {
            // 1. Create context and category in DB
            TimeContext context = new TimeContext();
            context.setUserId(user1.getId());
            context.setName("Original Context");

            TimeContextSlot slot = new TimeContextSlot();
            slot.setTimeContext(context);
            slot.setDayOfWeek(DayOfWeek.MONDAY);
            slot.setStartTime(LocalTime.of(9, 0));
            slot.setEndTime(LocalTime.of(12, 0));
            context.getSlots().add(slot);

            TimeContext savedContext = timeContextRepository.save(context);

            Category cat1 = new Category();
            cat1.setUserId(user1.getId());
            cat1.setName("Category 1");
            cat1.setColor("#111111");
            cat1.setTimeContext(savedContext);
            categoryRepository.save(cat1);

            Category cat2 = new Category();
            cat2.setUserId(user1.getId());
            cat2.setName("Category 2");
            cat2.setColor("#222222");
            categoryRepository.save(cat2);

            // 2. Perform PUT /api/time-contexts/{id} to update name, replace slot, change category to cat2
            TimeContextSlotDto newSlot = new TimeContextSlotDto(null, DayOfWeek.FRIDAY, LocalTime.of(14, 0), LocalTime.of(17, 0));
            TimeContextUpdateRequest updateRequest = new TimeContextUpdateRequest(
                    "Updated Context Name",
                    List.of(newSlot),
                    List.of(cat2.getId())
            );

            mockMvcUser1.perform(put("/api/time-contexts/{id}", savedContext.getId())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name", is("Updated Context Name")))
                    .andExpect(jsonPath("$.slots", hasSize(1)))
                    .andExpect(jsonPath("$.slots[0].dayOfWeek", is("FRIDAY")));

            // 3. Verify DB state
            timeContextRepository.flush();
            entityManager.clear();

            TimeContext dbContext = timeContextRepository.findById(savedContext.getId()).orElseThrow();
            assertEquals("Updated Context Name", dbContext.getName());
            assertEquals(1, dbContext.getSlots().size());
            assertEquals(DayOfWeek.FRIDAY, dbContext.getSlots().get(0).getDayOfWeek());

            Category updatedCat1 = categoryRepository.findById(cat1.getId()).orElseThrow();
            assertNull(updatedCat1.getTimeContext(), "cat1 should be unlinked");

            Category updatedCat2 = categoryRepository.findById(cat2.getId()).orElseThrow();
            assertNotNull(updatedCat2.getTimeContext());
            assertEquals(savedContext.getId(), updatedCat2.getTimeContext().getId());
        }

        @Test
        @DisplayName("Should return 404 Not Found when updating non-existent context")
        void updateTimeContext_NotFound() throws Exception {
            UUID randomId = UUID.randomUUID();
            TimeContextUpdateRequest updateRequest = new TimeContextUpdateRequest("New Name", Collections.emptyList(), Collections.emptyList());

            mockMvcUser1.perform(put("/api/time-contexts/{id}", randomId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("Delete Integration Flow")
    class DeleteFlow {

        @Test
        @DisplayName("Should delete TimeContext via HTTP DELETE, clear category references, and delete from DB")
        void deleteTimeContext_Success() throws Exception {
            // 1. Save context and associated category
            TimeContext context = new TimeContext();
            context.setUserId(user1.getId());
            context.setName("Context to Delete");
            TimeContext savedContext = timeContextRepository.save(context);

            Category category = new Category();
            category.setUserId(user1.getId());
            category.setName("Associated Category");
            category.setColor("#FF0000");
            category.setTimeContext(savedContext);
            categoryRepository.save(category);

            // 2. Perform DELETE /api/time-contexts/{id}
            mockMvcUser1.perform(delete("/api/time-contexts/{id}", savedContext.getId()))
                    .andExpect(status().isNoContent());

            // 3. Verify Database Deletion & Unlinking
            timeContextRepository.flush();
            entityManager.clear();

            assertTrue(timeContextRepository.findById(savedContext.getId()).isEmpty());

            Category dbCategory = categoryRepository.findById(category.getId()).orElseThrow();
            assertNull(dbCategory.getTimeContext());

            mockMvcUser1.perform(get("/api/time-contexts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));
        }

        @Test
        @DisplayName("Should return 404 Not Found when deleting non-existent context")
        void deleteTimeContext_NotFound() throws Exception {
            UUID randomId = UUID.randomUUID();

            mockMvcUser1.perform(delete("/api/time-contexts/{id}", randomId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message", is("Time Context not found with ID: " + randomId)));
        }
    }

    @Nested
    @DisplayName("Multi-User Data Isolation Integration Flow")
    class MultiUserDataIsolationFlow {

        @Test
        @DisplayName("User2 cannot access, update, or delete User1's TimeContext")
        void user2CannotAccessUser1Context() throws Exception {
            // 1. User 1 creates a TimeContext
            TimeContext context1 = new TimeContext();
            context1.setUserId(user1.getId());
            context1.setName("User 1 Private Context");
            TimeContext savedContext1 = timeContextRepository.save(context1);

            // 2. User 2 GET all -> should not see User 1's context
            mockMvcUser2.perform(get("/api/time-contexts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));

            // 3. User 2 GET by ID -> should return 404
            mockMvcUser2.perform(get("/api/time-contexts/{id}", savedContext1.getId()))
                    .andExpect(status().isNotFound());

            // 4. User 2 PUT -> should return 404
            TimeContextUpdateRequest updateRequest = new TimeContextUpdateRequest("Hacked Name", Collections.emptyList(), Collections.emptyList());
            mockMvcUser2.perform(put("/api/time-contexts/{id}", savedContext1.getId())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isNotFound());

            // 5. User 2 DELETE -> should return 404
            mockMvcUser2.perform(delete("/api/time-contexts/{id}", savedContext1.getId()))
                    .andExpect(status().isNotFound());

            // 6. Verify User 1's context is untouched in DB
            TimeContext dbContext1 = timeContextRepository.findById(savedContext1.getId()).orElseThrow();
            assertEquals("User 1 Private Context", dbContext1.getName());
        }
    }
}
