package nhk.task;

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

import java.time.LocalDateTime;
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
class TaskControllerTest {

    @Mock
    private TaskService taskService;

    @InjectMocks
    private TaskController taskController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private UUID userId;
    private UUID taskId;
    private UUID checklistId;
    private TaskDto sampleTaskDto;
    private TaskChecklistItemDto sampleChecklistItemDto;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        taskId = UUID.randomUUID();
        checklistId = UUID.randomUUID();

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

        mockMvc = MockMvcBuilders.standaloneSetup(taskController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        sampleTaskDto = TaskDto.builder()
                .id(taskId)
                .userId(userId)
                .title("Learn Unit Testing")
                .status("Backlog")
                .actualMinutes(0)
                .build();

        sampleChecklistItemDto = TaskChecklistItemDto.builder()
                .id(checklistId)
                .taskId(taskId)
                .title("Subtask Item")
                .isCompleted(false)
                .orderIndex(0)
                .build();
    }

    @Nested
    @DisplayName("GET /api/tasks")
    class GetTasksTests {

        @Test
        @DisplayName("Should return 200 OK and list of tasks")
        void getTasks_Success() throws Exception {
            when(taskService.getTasks(userId)).thenReturn(List.of(sampleTaskDto));

            mockMvc.perform(get("/api/tasks"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].id", is(taskId.toString())))
                    .andExpect(jsonPath("$[0].title", is("Learn Unit Testing")))
                    .andExpect(jsonPath("$[0].status", is("Backlog")));

            verify(taskService, times(1)).getTasks(userId);
        }
    }

    @Nested
    @DisplayName("POST /api/tasks")
    class CreateTaskTests {

        @Test
        @DisplayName("Should return 201 Created when TaskCreateRequest is valid")
        void createTask_Valid_Success() throws Exception {
            TaskCreateRequest request = new TaskCreateRequest(
                    "Learn Unit Testing", null, null, 30, false, false, false, null, null, null, "Backlog", null, null
            );

            when(taskService.createTask(any(TaskCreateRequest.class), eq(userId))).thenReturn(sampleTaskDto);

            mockMvc.perform(post("/api/tasks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id", is(taskId.toString())))
                    .andExpect(jsonPath("$.title", is("Learn Unit Testing")));

            verify(taskService, times(1)).createTask(any(TaskCreateRequest.class), eq(userId));
        }

        @Test
        @DisplayName("Should return 400 Bad Request when title is blank")
        void createTask_BlankTitle_BadRequest() throws Exception {
            TaskCreateRequest request = new TaskCreateRequest(
                    "", null, null, 30, false, false, false, null, null, null, "Backlog", null, null
            );

            mockMvc.perform(post("/api/tasks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(taskService, never()).createTask(any(), any());
        }
    }

    @Nested
    @DisplayName("PUT /api/tasks/{taskId}")
    class UpdateTaskTests {

        @Test
        @DisplayName("Should return 200 OK when update request is successful")
        void updateTask_Success() throws Exception {
            TaskUpdateRequest request = new TaskUpdateRequest(
                    "Updated Title", null, null, 45, 15, true, true, false, null, null, "Picked for Today", LocalDateTime.now(), "Notes", null, null, null, null
            );

            when(taskService.updateTask(eq(taskId), any(TaskUpdateRequest.class), eq(userId))).thenReturn(sampleTaskDto);

            mockMvc.perform(put("/api/tasks/{taskId}", taskId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(taskId.toString())));

            verify(taskService, times(1)).updateTask(eq(taskId), any(TaskUpdateRequest.class), eq(userId));
        }

        @Test
        @DisplayName("Should return 200 OK when partial update request without title is sent")
        void updateTask_PartialUpdate_Success() throws Exception {
            TaskUpdateRequest request = new TaskUpdateRequest(
                    null, null, null, null, null, false, true, null, null, null, null, null, null, null, null, null, null
            );

            when(taskService.updateTask(eq(taskId), any(TaskUpdateRequest.class), eq(userId))).thenReturn(sampleTaskDto);

            mockMvc.perform(put("/api/tasks/{taskId}", taskId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(taskId.toString())));

            verify(taskService, times(1)).updateTask(eq(taskId), any(TaskUpdateRequest.class), eq(userId));
        }
    }

    @Nested
    @DisplayName("DELETE /api/tasks/{taskId}")
    class DeleteTaskTests {

        @Test
        @DisplayName("Should return 204 No Content when task is deleted")
        void deleteTask_Success() throws Exception {
            doNothing().when(taskService).deleteTask(taskId, userId);

            mockMvc.perform(delete("/api/tasks/{taskId}", taskId))
                    .andExpect(status().isNoContent());

            verify(taskService, times(1)).deleteTask(taskId, userId);
        }
    }

    @Nested
    @DisplayName("POST /api/tasks/{taskId}/checklists")
    class AddChecklistItemTests {

        @Test
        @DisplayName("Should return 201 Created when adding checklist item")
        void addChecklistItem_Success() throws Exception {
            TaskChecklistItemRequest request = new TaskChecklistItemRequest(null, "Subtask Item", false, 0);

            when(taskService.addChecklistItem(eq(taskId), any(TaskChecklistItemRequest.class), eq(userId)))
                    .thenReturn(sampleChecklistItemDto);

            mockMvc.perform(post("/api/tasks/{taskId}/checklists", taskId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id", is(checklistId.toString())))
                    .andExpect(jsonPath("$.title", is("Subtask Item")));

            verify(taskService, times(1)).addChecklistItem(eq(taskId), any(TaskChecklistItemRequest.class), eq(userId));
        }

        @Test
        @DisplayName("Should return 400 Bad Request when checklist item title is blank")
        void addChecklistItem_BlankTitle_BadRequest() throws Exception {
            TaskChecklistItemRequest request = new TaskChecklistItemRequest(null, " ", false, 0);

            mockMvc.perform(post("/api/tasks/{taskId}/checklists", taskId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(taskService, never()).addChecklistItem(any(), any(), any());
        }
    }

    @Nested
    @DisplayName("PUT /api/tasks/{taskId}/checklists/{checklistId}")
    class UpdateChecklistItemTests {

        @Test
        @DisplayName("Should return 200 OK when updating checklist item")
        void updateChecklistItem_Success() throws Exception {
            TaskChecklistItemRequest request = new TaskChecklistItemRequest(checklistId, "Updated Item", true, 0);

            when(taskService.updateChecklistItem(eq(taskId), eq(checklistId), any(TaskChecklistItemRequest.class), eq(userId)))
                    .thenReturn(sampleChecklistItemDto);

            mockMvc.perform(put("/api/tasks/{taskId}/checklists/{checklistId}", taskId, checklistId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(checklistId.toString())));

            verify(taskService, times(1)).updateChecklistItem(eq(taskId), eq(checklistId), any(TaskChecklistItemRequest.class), eq(userId));
        }
    }

    @Nested
    @DisplayName("PUT /api/tasks/{taskId}/checklists/reorder")
    class ReorderChecklistsTests {

        @Test
        @DisplayName("Should return 200 OK when reordering checklists")
        void reorderChecklists_Success() throws Exception {
            List<UUID> checklistIds = List.of(checklistId, UUID.randomUUID());

            doNothing().when(taskService).reorderChecklists(eq(taskId), eq(checklistIds), eq(userId));

            mockMvc.perform(put("/api/tasks/{taskId}/checklists/reorder", taskId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(checklistIds)))
                    .andExpect(status().isOk());

            verify(taskService, times(1)).reorderChecklists(eq(taskId), eq(checklistIds), eq(userId));
        }
    }

    @Nested
    @DisplayName("DELETE /api/tasks/{taskId}/checklists/{checklistId}")
    class DeleteChecklistItemTests {

        @Test
        @DisplayName("Should return 204 No Content when deleting checklist item")
        void deleteChecklistItem_Success() throws Exception {
            doNothing().when(taskService).deleteChecklistItem(taskId, checklistId, userId);

            mockMvc.perform(delete("/api/tasks/{taskId}/checklists/{checklistId}", taskId, checklistId))
                    .andExpect(status().isNoContent());

            verify(taskService, times(1)).deleteChecklistItem(taskId, checklistId, userId);
        }
    }
}
