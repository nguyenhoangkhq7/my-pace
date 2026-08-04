package nhk.timeblock;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;
import nhk.task.Task;
import nhk.task.TaskRepository;
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
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
@TestPropertySource(properties = {
    "RESEND_API_KEY=test-api-key",
    "JWT_SECRET=test-jwt-secret-with-at-least-256-bits-length-so-it-does-not-fail-validation"
})
class TaskTimeBlockIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private TaskTimeBlockRepository timeBlockRepository;

    @Autowired
    private DailyPlanRepository dailyPlanRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    private ObjectMapper objectMapper;
    private MockMvc mockMvc;
    private User user1;
    private User user2;
    private RequestPostProcessor authUser1;
    private RequestPostProcessor authUser2;
    private DailyPlan user1Plan;
    private DailyPlan user2Plan;
    private Task user1Task;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        timeBlockRepository.deleteAll();
        dailyPlanRepository.deleteAll();
        taskRepository.deleteAll();
        userRepository.deleteAll();

        // Setup User 1
        user1 = new User();
        user1.setEmail("user1@example.com");
        user1.setPasswordHash("hashedpass");
        user1.setFullName("User One");
        user1.setRole(Role.USER);
        user1 = userRepository.save(user1);

        UserDetailsCustom customUser1 = new UserDetailsCustom(user1);
        UsernamePasswordAuthenticationToken token1 =
                new UsernamePasswordAuthenticationToken(customUser1, null, customUser1.getAuthorities());
        authUser1 = authentication(token1);

        // Setup User 2
        user2 = new User();
        user2.setEmail("user2@example.com");
        user2.setPasswordHash("hashedpass");
        user2.setFullName("User Two");
        user2.setRole(Role.USER);
        user2 = userRepository.save(user2);

        UserDetailsCustom customUser2 = new UserDetailsCustom(user2);
        UsernamePasswordAuthenticationToken token2 =
                new UsernamePasswordAuthenticationToken(customUser2, null, customUser2.getAuthorities());
        authUser2 = authentication(token2);

        // Create DailyPlan for User 1
        DailyPlan plan1 = new DailyPlan();
        plan1.setUserId(user1.getId());
        plan1.setPlanDate(LocalDate.now());
        plan1.setAvailableMinutes(480);
        plan1.setIsConfirmed(false);
        plan1.setIsReviewed(false);
        user1Plan = dailyPlanRepository.save(plan1);

        // Create DailyPlan for User 2
        DailyPlan plan2 = new DailyPlan();
        plan2.setUserId(user2.getId());
        plan2.setPlanDate(LocalDate.now());
        plan2.setAvailableMinutes(480);
        plan2.setIsConfirmed(false);
        plan2.setIsReviewed(false);
        user2Plan = dailyPlanRepository.save(plan2);

        // Create Task for User 1
        Task task = new Task();
        task.setUserId(user1.getId());
        task.setTitle("Integration Task 1");
        task.setEstimatedMinutes(60);
        task.setActualMinutes(0);
        task.setStatus("Picked for Today");
        task.setTaskType("AD_HOC");
        user1Task = taskRepository.save(task);
    }

    @Nested
    @DisplayName("Batch Save & Retrieve Integration Flow")
    class BatchSaveAndRetrieveFlow {

        @Test
        @DisplayName("Should save time block batch via HTTP POST and retrieve sorted by startTime via HTTP GET")
        void saveAndRetrieveTimeBlocks_Success() throws Exception {
            LocalDateTime start1 = LocalDateTime.of(2026, 8, 2, 9, 0);
            LocalDateTime end1 = LocalDateTime.of(2026, 8, 2, 10, 0);
            LocalDateTime start2 = LocalDateTime.of(2026, 8, 2, 10, 0);
            LocalDateTime end2 = LocalDateTime.of(2026, 8, 2, 11, 0);

            TaskTimeBlockRequest req1 = new TaskTimeBlockRequest(
                    user1Task.getId(), UUID.randomUUID(), start1, end1, 1, 2, "FREE"
            );
            TaskTimeBlockRequest req2 = new TaskTimeBlockRequest(
                    user1Task.getId(), UUID.randomUUID(), start2, end2, 2, 2, "FREE"
            );

            SaveTimeBlocksRequest batchRequest = new SaveTimeBlocksRequest(LocalDate.now(), List.of(req1, req2));

            // 1. Batch Save via HTTP POST
            mockMvc.perform(post("/api/time-blocks/batch")
                            .with(authUser1)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(batchRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$", hasSize(2)))
                    .andExpect(jsonPath("$[0].partIndex", is(1)))
                    .andExpect(jsonPath("$[1].partIndex", is(2)));

            // Verify DB State
            List<TaskTimeBlock> dbBlocks = timeBlockRepository.findByUserIdAndDateRange(user1.getId(), LocalDate.now().atStartOfDay(), LocalDate.now().plusDays(1).atStartOfDay());
            assertEquals(2, dbBlocks.size());

            // 2. Retrieve via HTTP GET
            mockMvc.perform(get("/api/time-blocks")
                            .param("startDate", LocalDate.now().toString())
                            .param("endDate", LocalDate.now().toString())
                            .with(authUser1))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(2)))
                    .andExpect(jsonPath("$[0].id", is(dbBlocks.get(0).getId().toString())))
                    .andExpect(jsonPath("$[1].id", is(dbBlocks.get(1).getId().toString())));
        }

        @Test
        @DisplayName("Re-saving batch for same plan should replace existing time blocks in DB")
        void reSaveBatch_ReplacesExisting() throws Exception {
            // Initial block
            TaskTimeBlock existing = new TaskTimeBlock();
            existing.setTaskId(user1Task.getId());
            // removed planId
            existing.setStartTime(LocalDateTime.of(2026, 8, 2, 8, 0));
            existing.setEndTime(LocalDateTime.of(2026, 8, 2, 9, 0));
            existing.setAvailabilityStatus("FREE");
            timeBlockRepository.save(existing);

            // New batch request with 1 new block
            TaskTimeBlockRequest newReq = new TaskTimeBlockRequest(
                    user1Task.getId(),
                    UUID.randomUUID(),
                    LocalDateTime.of(2026, 8, 2, 14, 0),
                    LocalDateTime.of(2026, 8, 2, 15, 0),
                    1, 1, "FREE"
            );
            SaveTimeBlocksRequest replaceRequest = new SaveTimeBlocksRequest(LocalDate.now(), List.of(newReq));

            mockMvc.perform(post("/api/time-blocks/batch")
                            .with(authUser1)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(replaceRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$", hasSize(1)));

            // DB verify: Old block deleted, new block saved
            List<TaskTimeBlock> dbBlocks = timeBlockRepository.findByUserIdAndDateRange(user1.getId(), LocalDate.now().atStartOfDay(), LocalDate.now().plusDays(1).atStartOfDay());
            assertEquals(1, dbBlocks.size());
            assertEquals(LocalDateTime.of(2026, 8, 2, 14, 0), dbBlocks.get(0).getStartTime());
        }
    }

    @Nested
    @DisplayName("Progress Update & Task Rollup Integration Flow")
    class ProgressUpdateAndTaskRollupFlow {

        @Test
        @DisplayName("Updating time block progress should update block status and rollup actualMinutes to Task entity")
        void updateProgress_RollsUpToTask_AndMarksDone() throws Exception {
            TaskTimeBlock block = new TaskTimeBlock();
            block.setTaskId(user1Task.getId());
            // removed planId
            block.setStartTime(LocalDateTime.of(2026, 8, 2, 9, 0));
            block.setEndTime(LocalDateTime.of(2026, 8, 2, 10, 0));
            block.setAvailabilityStatus("FREE");
            TaskTimeBlock savedBlock = timeBlockRepository.save(block);

            TaskTimeBlockController.UpdateTimeBlockProgressRequest progressRequest =
                    new TaskTimeBlockController.UpdateTimeBlockProgressRequest(60, true);

            mockMvc.perform(patch("/api/time-blocks/{id}/progress", savedBlock.getId())
                            .with(authUser1)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(progressRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.actualMinutes", is(60)))
                    .andExpect(jsonPath("$.isCompleted", is(true)))
                    .andExpect(jsonPath("$.availabilityStatus", is("BUSY")));

            // DB verify: Task actualMinutes updated to 60, status updated to 'Done'
            Task dbTask = taskRepository.findById(user1Task.getId()).orElseThrow();
            assertEquals(60, dbTask.getActualMinutes());
            assertEquals("Done", dbTask.getStatus());
            assertNotNull(dbTask.getDoneAt());
        }
    }

    @Nested
    @DisplayName("Split Time Block Integration Flow")
    class SplitTimeBlockFlow {

        @Test
        @DisplayName("Splitting block via HTTP POST creates a new second block and updates original block endTime")
        void splitTimeBlock_Success() throws Exception {
            TaskTimeBlock block = new TaskTimeBlock();
            block.setTaskId(user1Task.getId());
            // removed planId
            block.setStartTime(LocalDateTime.of(2026, 8, 2, 9, 0));
            block.setEndTime(LocalDateTime.of(2026, 8, 2, 10, 0));
            block.setPartIndex(1);
            block.setTotalParts(1);
            block.setAvailabilityStatus("FREE");
            TaskTimeBlock savedBlock = timeBlockRepository.save(block);

            TaskTimeBlockController.SplitTimeBlockRequest splitReq =
                    new TaskTimeBlockController.SplitTimeBlockRequest(30);

            mockMvc.perform(post("/api/time-blocks/{id}/split", savedBlock.getId())
                            .with(authUser1)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(splitReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(2)));

            // DB verify
            List<TaskTimeBlock> dbBlocks = timeBlockRepository.findByUserIdAndDateRange(user1.getId(), LocalDate.now().atStartOfDay(), LocalDate.now().plusDays(1).atStartOfDay());
            assertEquals(2, dbBlocks.size());
            assertEquals(LocalDateTime.of(2026, 8, 2, 9, 30), dbBlocks.get(0).getEndTime());
            assertEquals(LocalDateTime.of(2026, 8, 2, 9, 30), dbBlocks.get(1).getStartTime());
            assertEquals(2, dbBlocks.get(1).getPartIndex());
            assertEquals(2, dbBlocks.get(1).getTotalParts());
        }
    }

    @Nested
    @DisplayName("Toggle Lock Status Integration Flow")
    class ToggleLockStatusFlow {

        @Test
        @DisplayName("Toggling lock status updates availabilityStatus in DB")
        void toggleLockStatus_Success() throws Exception {
            TaskTimeBlock block = new TaskTimeBlock();
            block.setTaskId(user1Task.getId());
            // removed planId
            block.setStartTime(LocalDateTime.of(2026, 8, 2, 9, 0));
            block.setEndTime(LocalDateTime.of(2026, 8, 2, 10, 0));
            block.setAvailabilityStatus("FREE");
            TaskTimeBlock savedBlock = timeBlockRepository.save(block);

            TaskTimeBlockController.ToggleTimeBlockLockRequest lockRequest =
                    new TaskTimeBlockController.ToggleTimeBlockLockRequest("BUSY");

            mockMvc.perform(patch("/api/time-blocks/{id}/lock-status", savedBlock.getId())
                            .with(authUser1)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(lockRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.availabilityStatus", is("BUSY")));

            // DB verify
            TaskTimeBlock dbBlock = timeBlockRepository.findById(savedBlock.getId()).orElseThrow();
            assertEquals("BUSY", dbBlock.getAvailabilityStatus());
        }
    }

    @Nested
    @DisplayName("Multi-User Data Isolation Integration Flow")
    class UserDataIsolationFlow {

        @Test
        @DisplayName("User2 cannot access or modify User1's time blocks or daily plan")
        void userDataIsolation_Enforced() throws Exception {
            TaskTimeBlock user1Block = new TaskTimeBlock();
            user1Block.setTaskId(user1Task.getId());
            // removed planId
            user1Block.setStartTime(LocalDateTime.of(2026, 8, 2, 9, 0));
            user1Block.setEndTime(LocalDateTime.of(2026, 8, 2, 10, 0));
            user1Block.setAvailabilityStatus("FREE");
            TaskTimeBlock savedBlock1 = timeBlockRepository.save(user1Block);

            // User2 GET User1's plan -> returns 404 (EntityNotFoundException handled)
            mockMvc.perform(get("/api/time-blocks")
                            .param("startDate", LocalDate.now().toString())
                            .param("endDate", LocalDate.now().toString())
                            .with(authUser2))
                    .andExpect(status().isNotFound());

            // User2 PATCH progress on User1's block -> returns 404
            TaskTimeBlockController.UpdateTimeBlockProgressRequest progressReq =
                    new TaskTimeBlockController.UpdateTimeBlockProgressRequest(30, true);
            mockMvc.perform(patch("/api/time-blocks/{id}/progress", savedBlock1.getId())
                            .with(authUser2)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(progressReq)))
                    .andExpect(status().isNotFound());

            // User2 POST split on User1's block -> returns 404
            mockMvc.perform(post("/api/time-blocks/{id}/split", savedBlock1.getId())
                            .with(authUser2))
                    .andExpect(status().isNotFound());

            // User2 PATCH lock status on User1's block -> returns 404
            TaskTimeBlockController.ToggleTimeBlockLockRequest lockReq =
                    new TaskTimeBlockController.ToggleTimeBlockLockRequest("BUSY");
            mockMvc.perform(patch("/api/time-blocks/{id}/lock-status", savedBlock1.getId())
                            .with(authUser2)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(lockReq)))
                    .andExpect(status().isNotFound());

            // DB verify: User1's block remains untouched
            TaskTimeBlock dbBlock = timeBlockRepository.findById(savedBlock1.getId()).orElseThrow();
            assertEquals("FREE", dbBlock.getAvailabilityStatus());
            assertEquals(0, dbBlock.getActualMinutes());
        }
    }
}
