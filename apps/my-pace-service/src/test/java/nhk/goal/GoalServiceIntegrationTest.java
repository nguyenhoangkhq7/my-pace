package nhk.goal;

import nhk.category.Category;
import nhk.category.CategoryRepository;
import nhk.goal.GoalLimitExceededException;
import nhk.task.Task;
import nhk.task.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class GoalServiceIntegrationTest {

    @Autowired
    private GoalServiceImpl goalService;

    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TaskRepository taskRepository;

    private UUID userId;
    private Category category;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        category = new Category();
        category.setUserId(userId);
        category.setName("Integration Category " + UUID.randomUUID());
        category.setColor("#3b82f6");
        category = categoryRepository.save(category);
    }

    @Test
    @DisplayName("createGoal should persist new Goal in database and return GoalDto")
    void createGoal_PersistsInDatabase() {
        GoalCreateRequest request = new GoalCreateRequest(
                "Integration Goal", "Milestone", LocalDate.now(), LocalDate.now().plusDays(10),
                category.getId(), false, null, null, null
        );

        GoalDto created = goalService.createGoal(request, userId);

        assertThat(created).isNotNull();
        assertThat(created.id()).isNotNull();
        assertThat(created.title()).isEqualTo("Integration Goal");

        Goal found = goalRepository.findById(created.id()).orElse(null);
        assertThat(found).isNotNull();
        assertThat(found.getUserId()).isEqualTo(userId);
        assertThat(found.getStatus()).isEqualTo("In Progress");
        assertThat(found.getCategoryId()).isEqualTo(category.getId());
    }

    @Test
    @DisplayName("updateGoal should throw GoalLimitExceededException when active goal count reaches 5")
    void updateGoal_EnforcesActiveLimitOf5() {
        for (int i = 0; i < 5; i++) {
            Goal goal = new Goal();
            goal.setUserId(userId);
            goal.setTitle("Goal " + i);
            goal.setGoalType("Milestone");
            goal.setStatus("In Progress");
            goal.setCategoryId(category.getId());
            goalRepository.save(goal);
        }

        Goal frozenGoal = new Goal();
        frozenGoal.setUserId(userId);
        frozenGoal.setTitle("Frozen Goal");
        frozenGoal.setGoalType("Milestone");
        frozenGoal.setStatus("Freeze");
        frozenGoal.setCategoryId(category.getId());
        frozenGoal = goalRepository.save(frozenGoal);

        GoalUpdateRequest request = new GoalUpdateRequest(
                "Frozen Goal", "In Progress", null, null, category.getId(), false, null, null, null
        );

        UUID frozenId = frozenGoal.getId();
        assertThatThrownBy(() -> goalService.updateGoal(frozenId, request, userId))
                .isInstanceOf(GoalLimitExceededException.class)
                .hasMessage("Bạn chỉ được phép có tối đa 5 Goal đang In Progress.");
    }

    @Test
    @DisplayName("deleteGoal should archive goal when associated tasks exist")
    void deleteGoal_SoftArchiveWhenTasksExist() {
        Goal goal = new Goal();
        goal.setUserId(userId);
        goal.setTitle("Goal With Task");
        goal.setGoalType("Milestone");
        goal.setStatus("In Progress");
        goal.setCategoryId(category.getId());
        goal = goalRepository.save(goal);

        Task task = new Task();
        task.setUserId(userId);
        task.setGoalId(goal.getId());
        task.setTitle("Subtask");
        task.setStatus("Backlog");
        taskRepository.save(task);

        goalService.deleteGoal(goal.getId(), userId);

        Goal found = goalRepository.findById(goal.getId()).orElse(null);
        assertThat(found).isNotNull();
        assertThat(found.getStatus()).isEqualTo("Archived");
    }

    @Test
    @DisplayName("deleteGoal should physically delete goal when no tasks exist")
    void deleteGoal_HardDeleteWhenNoTasks() {
        Goal goal = new Goal();
        goal.setUserId(userId);
        goal.setTitle("Goal Without Tasks");
        goal.setGoalType("Milestone");
        goal.setStatus("In Progress");
        goal.setCategoryId(category.getId());
        goal = goalRepository.save(goal);

        goalService.deleteGoal(goal.getId(), userId);

        Goal found = goalRepository.findById(goal.getId()).orElse(null);
        assertThat(found).isNull();
    }

    @Test
    @DisplayName("updateGoalProgress for Binary Goal should calculate percentage and update status")
    void updateGoalProgress_BinaryGoal_CalculatesPercentageAndStatus() {
        Goal goal = new Goal();
        goal.setUserId(userId);
        goal.setTitle("Binary Goal");
        goal.setGoalType("Binary");
        goal.setStatus("In Progress");
        goal.setProgressPct(0);
        goal.setCategoryId(category.getId());
        goal = goalRepository.save(goal);

        Task task1 = new Task();
        task1.setUserId(userId);
        task1.setGoalId(goal.getId());
        task1.setTitle("Task 1");
        task1.setStatus("Done");
        taskRepository.save(task1);

        Task task2 = new Task();
        task2.setUserId(userId);
        task2.setGoalId(goal.getId());
        task2.setTitle("Task 2");
        task2.setStatus("Backlog");
        taskRepository.save(task2);

        goalService.updateGoalProgress(goal.getId());

        Goal updatedGoal = goalRepository.findById(goal.getId()).orElse(null);
        assertThat(updatedGoal).isNotNull();
        assertThat(updatedGoal.getProgressPct()).isEqualTo(50);
        assertThat(updatedGoal.getStatus()).isEqualTo("In Progress");

        task2.setStatus("Done");
        taskRepository.save(task2);

        goalService.updateGoalProgress(goal.getId());

        updatedGoal = goalRepository.findById(goal.getId()).orElse(null);
        assertThat(updatedGoal).isNotNull();
        assertThat(updatedGoal.getProgressPct()).isEqualTo(100);
        assertThat(updatedGoal.getStatus()).isEqualTo("Done");
    }
}
