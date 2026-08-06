package nhk.task;

import jakarta.persistence.EntityNotFoundException;
import nhk.category.Category;
import nhk.category.CategoryRepository;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import nhk.planning.DailyPlanTaskRepository;
import nhk.timeblock.TaskTimeBlockRepository;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = {
    "RESEND_API_KEY=test-api-key",
    "JWT_SECRET=test-jwt-secret-with-at-least-256-bits-length-so-it-does-not-fail-validation"
})
class TaskServiceIntegrationTest {

    @MockitoBean
    private nhk.mail.SendOtpMailService sendOtpMailService;

    @MockitoBean
    private org.springframework.data.redis.core.StringRedisTemplate stringRedisTemplate;

    @Autowired
    private TaskServiceImpl taskService;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DailyPlanTaskRepository dailyPlanTaskRepository;

    @Autowired
    private TaskTimeBlockRepository timeBlockRepository;

    private User sampleUser;
    private Category sampleCategory;
    private Goal sampleGoal;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setEmail("integration_" + UUID.randomUUID() + "@example.com");
        sampleUser.setPasswordHash("hashed_pass");
        sampleUser.setFullName("Integration User");
        sampleUser.setRole(Role.USER);
        sampleUser.setTimezone("Asia/Ho_Chi_Minh");
        sampleUser = userRepository.save(sampleUser);

        sampleCategory = new Category();
        sampleCategory.setUserId(sampleUser.getId());
        sampleCategory.setName("Integration Category " + UUID.randomUUID());
        sampleCategory.setColor("#3b82f6");
        sampleCategory = categoryRepository.save(sampleCategory);

        sampleGoal = new Goal();
        sampleGoal.setUserId(sampleUser.getId());
        sampleGoal.setTitle("Integration Goal " + UUID.randomUUID());
        sampleGoal.setGoalType("Milestone");
        sampleGoal.setStatus("In Progress");
        sampleGoal.setCategoryId(sampleCategory.getId());
        sampleGoal = goalRepository.save(sampleGoal);
    }

    @Nested
    @DisplayName("getTasks Integration Tests")
    class GetTasksTests {

        @Test
        @DisplayName("Should retrieve all tasks created for the user from database")
        void getTasks_ReturnsPersistedTasks() {
            Task task1 = new Task();
            task1.setUserId(sampleUser.getId());
            task1.setTitle("Task 1");
            task1.setStatus("Backlog");
            taskRepository.save(task1);

            Task task2 = new Task();
            task2.setUserId(sampleUser.getId());
            task2.setTitle("Task 2");
            task2.setStatus("Picked for Today");
            taskRepository.save(task2);

            List<TaskDto> tasks = taskService.getTasks(sampleUser.getId());

            assertThat(tasks).hasSize(2);
            assertThat(tasks).extracting(TaskDto::title).containsExactlyInAnyOrder("Task 1", "Task 2");
        }

        @Test
        @DisplayName("Should return empty list when no tasks exist for user")
        void getTasks_ReturnsEmptyList() {
            List<TaskDto> tasks = taskService.getTasks(sampleUser.getId());

            assertThat(tasks).isEmpty();
        }
    }

    @Nested
    @DisplayName("createTask Integration Tests")
    class CreateTaskTests {

        @Test
        @DisplayName("Should persist new task with default values in database")
        void createTask_DefaultValues_Persisted() {
            TaskCreateRequest request = new TaskCreateRequest(
                    "Default Task", null, sampleCategory.getId(), 45, null, null, null, null, null, null, null, null, null
            );

            TaskDto created = taskService.createTask(request, sampleUser.getId());

            assertThat(created).isNotNull();
            assertThat(created.id()).isNotNull();
            assertThat(created.title()).isEqualTo("Default Task");
            assertThat(created.status()).isEqualTo("Backlog");

            Task found = taskRepository.findById(created.id()).orElse(null);
            assertThat(found).isNotNull();
            assertThat(found.getIsUrgent()).isFalse();
            assertThat(found.getIsImportant()).isFalse();
            assertThat(found.getIsSplittable()).isFalse();
            assertThat(found.getUserId()).isEqualTo(sampleUser.getId());
        }

        @Test
        @DisplayName("Should create task with valid goal and update goal progress")
        void createTask_WithValidGoal_UpdatesGoalProgress() {
            TaskCreateRequest request = new TaskCreateRequest(
                    "Goal Task", sampleGoal.getId(), sampleCategory.getId(), 60, true, true, false, null, null, null, "Backlog", "Notes", null
            );

            TaskDto created = taskService.createTask(request, sampleUser.getId());

            assertThat(created).isNotNull();
            assertThat(created.goalId()).isEqualTo(sampleGoal.getId());

            Goal updatedGoal = goalRepository.findById(sampleGoal.getId()).orElse(null);
            assertThat(updatedGoal).isNotNull();
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when creating task linked to Frozen goal")
        void createTask_WithFrozenGoal_ThrowsException() {
            sampleGoal.setStatus("Freeze");
            goalRepository.save(sampleGoal);

            TaskCreateRequest request = new TaskCreateRequest(
                    "Invalid Task", sampleGoal.getId(), sampleCategory.getId(), 30, null, null, null, null, null, null, null, null, null
            );

            assertThatThrownBy(() -> taskService.createTask(request, sampleUser.getId()))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Chỉ có thể liên kết Task với Goal đang In Progress hoặc Done.");
        }

        @Test
        @DisplayName("Should persist checklists when creating task with checklist items")
        void createTask_WithChecklists_PersistsChecklistItems() {
            TaskChecklistItemRequest item1 = new TaskChecklistItemRequest(null, "Step 1", false, 0);
            TaskChecklistItemRequest item2 = new TaskChecklistItemRequest(null, "Step 2", true, 1);

            TaskCreateRequest request = new TaskCreateRequest(
                    "Task with Checklist", null, sampleCategory.getId(), 30, null, null, null, null, null, null, null, null,
                    List.of(item1, item2)
            );

            TaskDto created = taskService.createTask(request, sampleUser.getId());

            Task found = taskRepository.findById(created.id()).orElse(null);
            assertThat(found).isNotNull();
            assertThat(found.getChecklists()).hasSize(2);
            assertThat(found.getChecklists().get(0).getTitle()).isEqualTo("Step 1");
            assertThat(found.getChecklists().get(1).getIsCompleted()).isTrue();
        }
    }

    @Nested
    @DisplayName("updateTask Integration Tests")
    class UpdateTaskTests {

        @Test
        @DisplayName("Should update task attributes in database")
        void updateTask_UpdatesAttributesInDatabase() {
            Task task = new Task();
            task.setUserId(sampleUser.getId());
            task.setTitle("Original Title");
            task.setStatus("Backlog");
            task = taskRepository.save(task);

            TaskUpdateRequest request = new TaskUpdateRequest(
                    "Updated Title", null, sampleCategory.getId(), 60, 20, true, false, true, 15, 120, "Picked for Today", LocalDateTime.now(), "Updated Notes", null
            );

            TaskDto updated = taskService.updateTask(task.getId(), request, sampleUser.getId());

            assertThat(updated).isNotNull();
            assertThat(updated.title()).isEqualTo("Updated Title");

            Task found = taskRepository.findById(task.getId()).orElse(null);
            assertThat(found).isNotNull();
            assertThat(found.getTitle()).isEqualTo("Updated Title");
            assertThat(found.getIsUrgent()).isTrue();
            assertThat(found.getStatus()).isEqualTo("Picked for Today");
            assertThat(found.getNotes()).isEqualTo("Updated Notes");
        }

        @Test
        @DisplayName("Should set doneAt timestamp when status transitions to Done")
        void updateTask_TransitionToDone_SetsDoneAt() {
            Task task = new Task();
            task.setUserId(sampleUser.getId());
            task.setTitle("Task To Finish");
            task.setStatus("Backlog");
            task = taskRepository.save(task);

            TaskUpdateRequest request = new TaskUpdateRequest(
                    "Task To Finish", null, sampleCategory.getId(), 30, 30, false, false, false, null, null, "Done", null, null, null
            );

            TaskDto updated = taskService.updateTask(task.getId(), request, sampleUser.getId());

            assertThat(updated.doneAt()).isNotNull();

            Task found = taskRepository.findById(task.getId()).orElse(null);
            assertThat(found).isNotNull();
            assertThat(found.getStatus()).isEqualTo("Done");
            assertThat(found.getDoneAt()).isNotNull();
        }

        @Test
        @DisplayName("Should clear doneAt timestamp when status transitions from Done to Backlog")
        void updateTask_TransitionFromDoneToBacklog_ClearsDoneAt() {
            Task task = new Task();
            task.setUserId(sampleUser.getId());
            task.setTitle("Done Task");
            task.setStatus("Done");
            task.setDoneAt(java.time.OffsetDateTime.now());
            task = taskRepository.save(task);

            TaskUpdateRequest request = new TaskUpdateRequest(
                    "Done Task", null, sampleCategory.getId(), 30, 30, false, false, false, null, null, "Backlog", null, null, null
            );

            TaskDto updated = taskService.updateTask(task.getId(), request, sampleUser.getId());

            assertThat(updated.doneAt()).isNull();

            Task found = taskRepository.findById(task.getId()).orElse(null);
            assertThat(found).isNotNull();
            assertThat(found.getStatus()).isEqualTo("Backlog");
            assertThat(found.getDoneAt()).isNull();
        }
    }

    @Nested
    @DisplayName("deleteTask Integration Tests")
    class DeleteTaskTests {

        @Test
        @DisplayName("Should delete task from database")
        void deleteTask_RemovesTaskFromDatabase() {
            Task task = new Task();
            task.setUserId(sampleUser.getId());
            task.setGoalId(sampleGoal.getId());
            task.setTitle("Task to Delete");
            task.setStatus("Backlog");
            task = taskRepository.save(task);

            UUID taskId = task.getId();
            taskService.deleteTask(taskId, sampleUser.getId());

            Task found = taskRepository.findById(taskId).orElse(null);
            assertThat(found).isNull();
        }
    }

    @Nested
    @DisplayName("Checklist Operations Integration Tests")
    class ChecklistOperationsTests {

        @Test
        @DisplayName("Should add, update, reorder and delete checklist items in database")
        void checklistLifecycle_FullIntegrationFlow() {
            Task task = new Task();
            task.setUserId(sampleUser.getId());
            task.setTitle("Task with Checklist Flow");
            task.setStatus("Backlog");
            task = taskRepository.save(task);

            // 1. Add checklist item
            TaskChecklistItemRequest addReq1 = new TaskChecklistItemRequest(null, "Item A", false, null);
            TaskChecklistItemDto itemA = taskService.addChecklistItem(task.getId(), addReq1, sampleUser.getId());
            assertThat(itemA.id()).isNotNull();
            assertThat(itemA.title()).isEqualTo("Item A");

            TaskChecklistItemRequest addReq2 = new TaskChecklistItemRequest(null, "Item B", false, null);
            TaskChecklistItemDto itemB = taskService.addChecklistItem(task.getId(), addReq2, sampleUser.getId());

            // 2. Update checklist item
            TaskChecklistItemRequest updateReq = new TaskChecklistItemRequest(itemA.id(), "Item A Updated", true, 0);
            TaskChecklistItemDto updatedItemA = taskService.updateChecklistItem(task.getId(), itemA.id(), updateReq, sampleUser.getId());
            assertThat(updatedItemA.title()).isEqualTo("Item A Updated");
            assertThat(updatedItemA.isCompleted()).isTrue();

            // 3. Reorder checklist items
            taskService.reorderChecklists(task.getId(), List.of(itemB.id(), itemA.id()), sampleUser.getId());

            Task reorderedTask = taskRepository.findById(task.getId()).orElseThrow();
            TaskChecklistItem reorderedB = reorderedTask.getChecklists().stream().filter(c -> c.getId().equals(itemB.id())).findFirst().orElseThrow();
            assertThat(reorderedB.getOrderIndex()).isEqualTo(0);

            // 4. Delete checklist item
            taskService.deleteChecklistItem(task.getId(), itemA.id(), sampleUser.getId());
            Task finalTask = taskRepository.findById(task.getId()).orElseThrow();
            assertThat(finalTask.getChecklists()).hasSize(1);
            assertThat(finalTask.getChecklists().get(0).getId()).isEqualTo(itemB.id());
        }
    }
}
