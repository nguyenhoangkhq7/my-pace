package nhk.goal;

import jakarta.persistence.EntityManager;
import nhk.category.Category;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class GoalRepositoryIntegrationTest {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private GoalRepository goalRepository;

    private UUID userId1;
    private UUID userId2;
    private Category categoryA;
    private Category categoryB;

    @BeforeEach
    void setUp() {
        userId1 = UUID.randomUUID();
        userId2 = UUID.randomUUID();

        categoryA = new Category();
        categoryA.setUserId(userId1);
        categoryA.setName("Category A " + UUID.randomUUID());
        categoryA.setColor("#3b82f6");
        entityManager.persist(categoryA);

        categoryB = new Category();
        categoryB.setUserId(userId1);
        categoryB.setName("Category B " + UUID.randomUUID());
        categoryB.setColor("#ef4444");
        entityManager.persist(categoryB);

        entityManager.flush();
    }

    private Goal buildGoal(UUID userId, String title, String goalType, String status, UUID categoryId) {
        Goal goal = new Goal();
        goal.setUserId(userId);
        goal.setTitle(title);
        goal.setGoalType(goalType);
        goal.setStatus(status);
        goal.setCategoryId(categoryId);
        goal.setProgressPct(0);
        goal.setAutoCreateTask(false);
        goal.setIsDeleted(false);
        return goal;
    }

    @Test
    @DisplayName("findByUserId should return active goals belonging only to the specified user")
    void findByUserId_ReturnsUserActiveGoals() {
        Goal goal1 = buildGoal(userId1, "Goal 1", "Milestone", "In Progress", categoryA.getId());
        Goal goal2 = buildGoal(userId1, "Goal 2", "Binary", "Freeze", categoryB.getId());
        Goal goalOther = buildGoal(userId2, "Goal Other User", "Milestone", "In Progress", categoryA.getId());

        entityManager.persist(goal1);
        entityManager.persist(goal2);
        entityManager.persist(goalOther);
        entityManager.flush();

        List<Goal> results = goalRepository.findByUserId(userId1);

        assertThat(results).hasSize(2);
        assertThat(results).extracting(Goal::getId).containsExactlyInAnyOrder(goal1.getId(), goal2.getId());
    }

    @Test
    @DisplayName("findByUserIdAndStatus should filter goals by userId and status")
    void findByUserIdAndStatus_FiltersCorrectly() {
        Goal goal1 = buildGoal(userId1, "Goal 1", "Milestone", "In Progress", categoryA.getId());
        Goal goal2 = buildGoal(userId1, "Goal 2", "Milestone", "Done", categoryA.getId());
        Goal goal3 = buildGoal(userId1, "Goal 3", "Binary", "Archived", categoryB.getId());

        entityManager.persist(goal1);
        entityManager.persist(goal2);
        entityManager.persist(goal3);
        entityManager.flush();

        List<Goal> results = goalRepository.findByUserIdAndStatus(userId1, "In Progress");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo(goal1.getId());
    }

    @Test
    @DisplayName("countByUserIdAndStatus should return exact count of goals with matching status")
    void countByUserIdAndStatus_ReturnsCorrectCount() {
        entityManager.persist(buildGoal(userId1, "Goal 1", "Milestone", "In Progress", categoryA.getId()));
        entityManager.persist(buildGoal(userId1, "Goal 2", "Binary", "In Progress", categoryB.getId()));
        entityManager.persist(buildGoal(userId1, "Goal 3", "Milestone", "Done", categoryA.getId()));
        entityManager.flush();

        int count = goalRepository.countByUserIdAndStatus(userId1, "In Progress");

        assertThat(count).isEqualTo(2);
    }

    @Test
    @DisplayName("clearCategoryId should set categoryId to null for all matching goals")
    void clearCategoryId_UpdatesMatchingGoalsToNull() {
        Goal goal1 = buildGoal(userId1, "Goal 1", "Milestone", "In Progress", categoryA.getId());
        Goal goal2 = buildGoal(userId1, "Goal 2", "Binary", "In Progress", categoryA.getId());
        Goal goal3 = buildGoal(userId1, "Goal 3", "Binary", "In Progress", categoryB.getId());

        entityManager.persist(goal1);
        entityManager.persist(goal2);
        entityManager.persist(goal3);
        entityManager.flush();

        goalRepository.clearCategoryId(categoryA.getId());

        entityManager.clear();

        Goal updatedGoal1 = entityManager.find(Goal.class, goal1.getId());
        Goal updatedGoal2 = entityManager.find(Goal.class, goal2.getId());
        Goal updatedGoal3 = entityManager.find(Goal.class, goal3.getId());

        assertThat(updatedGoal1.getCategoryId()).isNull();
        assertThat(updatedGoal2.getCategoryId()).isNull();
        assertThat(updatedGoal3.getCategoryId()).isEqualTo(categoryB.getId());
    }

    @Test
    @DisplayName("delete should execute soft delete and exclude goal from future queries")
    void delete_ExecutesSoftDelete() {
        Goal goal = buildGoal(userId1, "Goal to Delete", "Milestone", "In Progress", categoryA.getId());
        entityManager.persist(goal);
        entityManager.flush();
        UUID goalId = goal.getId();

        goalRepository.delete(goal);
        entityManager.flush();
        entityManager.clear();

        Optional<Goal> found = goalRepository.findById(goalId);
        assertThat(found).isEmpty();

        List<Goal> userGoals = goalRepository.findByUserId(userId1);
        assertThat(userGoals).isEmpty();
    }
}
