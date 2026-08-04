package nhk.timeblock;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserDetailsCustom;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
class TaskTimeBlockControllerTest {

    @Mock
    private TaskTimeBlockService timeBlockService;

    @InjectMocks
    private TaskTimeBlockController timeBlockController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private UUID userId;
    private UUID dailyPlanId;
    private UUID blockId;
    private UUID taskId;
    private TaskTimeBlockDto sampleDto;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        dailyPlanId = UUID.randomUUID();
        blockId = UUID.randomUUID();
        taskId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setEmail("test@example.com");
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

        mockMvc = MockMvcBuilders.standaloneSetup(timeBlockController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        sampleDto = new TaskTimeBlockDto(
                blockId,
                taskId,
                LocalDateTime.of(2026, 8, 2, 9, 0),
                LocalDateTime.of(2026, 8, 2, 10, 0),
                1,
                1,
                0,
                false,
                null,
                "FREE"
        );
    }

    @Test
    @DisplayName("GET /api/time-blocks - Should return status 200 and list of time blocks")
    void getTimeBlocks_Success() throws Exception {
        when(timeBlockService.getTimeBlocks(any(), any(), eq(userId)))
                .thenReturn(List.of(sampleDto));

        mockMvc.perform(get("/api/time-blocks")
                        .param("startDate", "2026-08-02")
                        .param("endDate", "2026-08-02"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(blockId.toString())))
                .andExpect(jsonPath("$[0].availabilityStatus", is("FREE")));

        verify(timeBlockService, times(1)).getTimeBlocks(any(), any(), eq(userId));
    }

    @Test
    @DisplayName("POST /api/time-blocks/batch - Should return status 201 Created and list of saved time blocks")
    void saveTimeBlocks_Success() throws Exception {
        TaskTimeBlockRequest requestItem = new TaskTimeBlockRequest(
                taskId,
                UUID.randomUUID(),
                LocalDateTime.of(2026, 8, 2, 9, 0),
                LocalDateTime.of(2026, 8, 2, 10, 0),
                1,
                1,
                "FREE"
        );
        SaveTimeBlocksRequest batchRequest = new SaveTimeBlocksRequest(LocalDate.now(), List.of(requestItem));

        when(timeBlockService.saveTimeBlocks(any(SaveTimeBlocksRequest.class), eq(userId)))
                .thenReturn(List.of(sampleDto));

        mockMvc.perform(post("/api/time-blocks/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batchRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(blockId.toString())));

        verify(timeBlockService, times(1)).saveTimeBlocks(any(SaveTimeBlocksRequest.class), eq(userId));
    }

    @Test
    @DisplayName("PATCH /api/time-blocks/{id}/progress - Should return status 200 OK and updated time block DTO")
    void updateProgress_Success() throws Exception {
        TaskTimeBlockController.UpdateTimeBlockProgressRequest progressRequest =
                new TaskTimeBlockController.UpdateTimeBlockProgressRequest(30, true);

        TaskTimeBlockDto updatedDto = new TaskTimeBlockDto(
                blockId,
                taskId,
                LocalDateTime.of(2026, 8, 2, 9, 0),
                LocalDateTime.of(2026, 8, 2, 10, 0),
                1,
                1,
                30,
                true,
                null,
                "BUSY"
        );

        when(timeBlockService.updateTimeBlockProgress(eq(blockId), eq(30), eq(true), eq(userId)))
                .thenReturn(updatedDto);

        mockMvc.perform(patch("/api/time-blocks/{id}/progress", blockId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(progressRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(blockId.toString())))
                .andExpect(jsonPath("$.actualMinutes", is(30)))
                .andExpect(jsonPath("$.isCompleted", is(true)))
                .andExpect(jsonPath("$.availabilityStatus", is("BUSY")));

        verify(timeBlockService, times(1)).updateTimeBlockProgress(eq(blockId), eq(30), eq(true), eq(userId));
    }

    @Test
    @DisplayName("POST /api/time-blocks/{id}/split - Should return status 200 OK with split blocks when request body provided")
    void splitTimeBlock_WithBody_Success() throws Exception {
        TaskTimeBlockController.SplitTimeBlockRequest splitRequest =
                new TaskTimeBlockController.SplitTimeBlockRequest(30);

        when(timeBlockService.splitTimeBlock(eq(blockId), eq(30), eq(userId)))
                .thenReturn(List.of(sampleDto));

        mockMvc.perform(post("/api/time-blocks/{id}/split", blockId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(splitRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        verify(timeBlockService, times(1)).splitTimeBlock(eq(blockId), eq(30), eq(userId));
    }

    @Test
    @DisplayName("POST /api/time-blocks/{id}/split - Should return status 200 OK when request body is omitted")
    void splitTimeBlock_WithoutBody_Success() throws Exception {
        when(timeBlockService.splitTimeBlock(eq(blockId), eq(null), eq(userId)))
                .thenReturn(List.of(sampleDto));

        mockMvc.perform(post("/api/time-blocks/{id}/split", blockId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        verify(timeBlockService, times(1)).splitTimeBlock(eq(blockId), eq(null), eq(userId));
    }

    @Test
    @DisplayName("PATCH /api/time-blocks/{id}/lock-status - Should return status 200 OK and updated lock status")
    void toggleLockStatus_Success() throws Exception {
        TaskTimeBlockController.ToggleTimeBlockLockRequest lockRequest =
                new TaskTimeBlockController.ToggleTimeBlockLockRequest("BUSY");

        TaskTimeBlockDto updatedDto = new TaskTimeBlockDto(
                blockId,
                taskId,
                LocalDateTime.of(2026, 8, 2, 9, 0),
                LocalDateTime.of(2026, 8, 2, 10, 0),
                1,
                1,
                0,
                false,
                null,
                "BUSY"
        );

        when(timeBlockService.toggleTimeBlockLockStatus(eq(blockId), eq("BUSY"), eq(userId)))
                .thenReturn(updatedDto);

        mockMvc.perform(patch("/api/time-blocks/{id}/lock-status", blockId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(lockRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(blockId.toString())))
                .andExpect(jsonPath("$.availabilityStatus", is("BUSY")));

        verify(timeBlockService, times(1)).toggleTimeBlockLockStatus(eq(blockId), eq("BUSY"), eq(userId));
    }
}
