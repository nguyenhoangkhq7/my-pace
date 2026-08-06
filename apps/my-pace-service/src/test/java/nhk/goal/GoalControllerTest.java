package nhk.goal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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

import java.time.LocalDate;
import java.time.OffsetDateTime;
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
class GoalControllerTest {

    @Mock
    private GoalService goalService;

    @InjectMocks
    private GoalController goalController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private UUID userId;
    private UUID categoryId;
    private UUID goalId;
    private GoalDto sampleGoalDto;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        categoryId = UUID.randomUUID();
        goalId = UUID.randomUUID();

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

        mockMvc = MockMvcBuilders.standaloneSetup(goalController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        sampleGoalDto = new GoalDto(
                goalId,
                "Learn Goal API",
                "Milestone",
                "In Progress",
                LocalDate.now(),
                LocalDate.now().plusDays(30),
                OffsetDateTime.now(),
                OffsetDateTime.now(),
                categoryId,
                0,
                false,
                null,
                null,
                null
        );
    }

    @Nested
    @DisplayName("GET /api/goals")
    class GetGoalsTests {

        @Test
        @DisplayName("Should return 200 OK and list of goals")
        void getGoals_Success() throws Exception {
            when(goalService.getGoals(userId)).thenReturn(List.of(sampleGoalDto));

            mockMvc.perform(get("/api/goals"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].id", is(goalId.toString())))
                    .andExpect(jsonPath("$[0].title", is("Learn Goal API")))
                    .andExpect(jsonPath("$[0].goalType", is("Milestone")));

            verify(goalService, times(1)).getGoals(userId);
        }
    }

    @Nested
    @DisplayName("POST /api/goals")
    class CreateGoalTests {

        @Test
        @DisplayName("Should return 200 OK when request body is valid")
        void createGoal_Valid_Success() throws Exception {
            GoalCreateRequest request = new GoalCreateRequest(
                    "Learn Goal API", "Milestone", LocalDate.now(), LocalDate.now().plusDays(30),
                    categoryId, false, null, null, null
            );

            when(goalService.createGoal(any(GoalCreateRequest.class), eq(userId))).thenReturn(sampleGoalDto);

            mockMvc.perform(post("/api/goals")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(goalId.toString())))
                    .andExpect(jsonPath("$.title", is("Learn Goal API")));

            verify(goalService, times(1)).createGoal(any(GoalCreateRequest.class), eq(userId));
        }

        @Test
        @DisplayName("Should return 400 Bad Request when request validation fails (title is null)")
        void createGoal_InvalidTitle_BadRequest() throws Exception {
            GoalCreateRequest request = new GoalCreateRequest(
                    null, "Milestone", LocalDate.now(), LocalDate.now().plusDays(30),
                    categoryId, false, null, null, null
            );

            mockMvc.perform(post("/api/goals")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(goalService, never()).createGoal(any(), any());
        }

        @Test
        @DisplayName("Should return 400 Bad Request when request validation fails (categoryId is null)")
        void createGoal_InvalidCategory_BadRequest() throws Exception {
            GoalCreateRequest request = new GoalCreateRequest(
                    "Learn Goal API", "Milestone", LocalDate.now(), LocalDate.now().plusDays(30),
                    null, false, null, null, null
            );

            mockMvc.perform(post("/api/goals")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(goalService, never()).createGoal(any(), any());
        }
    }

    @Nested
    @DisplayName("PUT /api/goals/{id}")
    class UpdateGoalTests {

        @Test
        @DisplayName("Should return 200 OK when update request is valid")
        void updateGoal_Valid_Success() throws Exception {
            GoalUpdateRequest request = new GoalUpdateRequest(
                    "Updated Title", "In Progress", LocalDate.now(), LocalDate.now().plusDays(30),
                    categoryId, false, null, null, null
            );

            when(goalService.updateGoal(eq(goalId), any(GoalUpdateRequest.class), eq(userId))).thenReturn(sampleGoalDto);

            mockMvc.perform(put("/api/goals/{id}", goalId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(goalId.toString())));

            verify(goalService, times(1)).updateGoal(eq(goalId), any(GoalUpdateRequest.class), eq(userId));
        }
    }

    @Nested
    @DisplayName("DELETE /api/goals/{id}")
    class DeleteGoalTests {

        @Test
        @DisplayName("Should return 200 OK when goal is deleted")
        void deleteGoal_Success() throws Exception {
            doNothing().when(goalService).deleteGoal(goalId, userId);

            mockMvc.perform(delete("/api/goals/{id}", goalId))
                    .andExpect(status().isOk());

            verify(goalService, times(1)).deleteGoal(goalId, userId);
        }
    }
}
