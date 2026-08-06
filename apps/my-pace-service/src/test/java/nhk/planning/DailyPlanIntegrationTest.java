package nhk.planning;

import nhk.calendar.FixedEventService;
import nhk.category.Category;
import nhk.category.CategoryRepository;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import nhk.mail.SendOtpMailService;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.timeblock.TaskTimeBlockRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
    "RESEND_API_KEY=test-api-key",
    "JWT_SECRET=test-jwt-secret-with-at-least-256-bits-length-so-it-does-not-fail-validation",
    "spring.datasource.url=jdbc:h2:mem:testdb_planning;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.flyway.enabled=false"
})
@Transactional
class DailyPlanIntegrationTest {

    @Autowired
    private DailyPlanService dailyPlanService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private DailyPlanRepository dailyPlanRepository;

    @Autowired
    private DailyPlanTaskRepository dailyPlanTaskRepository;

    @Autowired
    private TaskTimeBlockRepository timeBlockRepository;

    @MockitoBean
    private SendOtpMailService sendOtpMailService;

    @MockitoBean
    private FixedEventService fixedEventService;

    private User testUser;
    private final LocalDate today = LocalDate.of(2026, 8, 2);

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("planner_" + UUID.randomUUID() + "@test.com");
        testUser.setPasswordHash("password123");
        testUser.setFullName("Planner User");
        testUser.setTimezone("Asia/Ho_Chi_Minh");
        testUser.setWakeTime(LocalTime.of(7, 0));
        testUser.setSleepTime(LocalTime.of(23, 0));
        testUser = userRepository.save(testUser);
    }

    @Test
    @DisplayName("Integration Test: Full Daily Planning Lifecycle (Plan -> Confirm -> Toggle Done -> Review -> Cancel)")
    void testFullDailyPlanningLifecycle() {
        // 1. Create a Category & Goal
        Category category = new Category();
        category.setUserId(testUser.getId());
        category.setName("Work");
        category.setColor("#FF0000");
        category = categoryRepository.save(category);

        Goal goal = new Goal();
        goal.setUserId(testUser.getId());
        goal.setCategoryId(category.getId());
        goal.setTitle("Complete Q3 Deliverables");
        goal.setGoalType("Binary");
        goal.setStatus("In Progress");
        goal = goalRepository.save(goal);

        // 2. Create Tasks
        Task task1 = new Task();
        task1.setUserId(testUser.getId());
        task1.setGoalId(goal.getId());
        task1.setCategoryId(category.getId());
        task1.setTitle("Task 1 - Core Feature");
        task1.setEstimatedMinutes(60);
        task1.setStatus("Backlog");
        task1.setIsImportant(true);
        task1.setIsUrgent(true);
        final Task savedTask1 = taskRepository.save(task1);

        Task task2 = new Task();
        task2.setUserId(testUser.getId());
        task2.setGoalId(goal.getId());
        task2.setCategoryId(category.getId());
        task2.setTitle("Task 2 - Code Review");
        task2.setEstimatedMinutes(30);
        task2.setStatus("Backlog");
        task2.setIsImportant(true);
        task2.setIsUrgent(false);
        final Task savedTask2 = taskRepository.save(task2);

        final UUID task1Id = savedTask1.getId();
        final UUID task2Id = savedTask2.getId();

        // 3. Plan My Day
        PlanMyDayRequest planRequest = new PlanMyDayRequest(
                today,
                120,
                List.of(
                        new PlanMyDayRequest.PlanTaskItem(task1Id, true, 1),
                        new PlanMyDayRequest.PlanTaskItem(task2Id, false, 2)
                )
        );

        DailyPlanDto planDto = dailyPlanService.planMyDay(planRequest, testUser.getId());
        assertThat(planDto).isNotNull();
        assertThat(planDto.tasks()).hasSize(2);
        assertThat(planDto.availableMinutes()).isEqualTo(120);

        // Verify tasks in database transitioned to "Picked for Today"
        Task reloadedTask1 = taskRepository.findById(task1Id).orElseThrow();
        assertThat(reloadedTask1.getStatus()).isEqualTo("Picked for Today");

        // 4. Confirm Plan
        DailyPlanDto confirmedDto = dailyPlanService.confirmPlan(today, testUser.getId());
        assertThat(confirmedDto.isConfirmed()).isTrue();
        assertThat(confirmedDto.confirmedAt()).isNotNull();

        // 5. Toggle Task 1 to Done
        DailyPlanTaskDto planTaskDto = planDto.tasks().stream()
                .filter(t -> t.task().id().equals(task1Id))
                .findFirst()
                .orElseThrow();

        dailyPlanService.toggleTaskDone(planTaskDto.id(), testUser.getId());

        Task doneTask = taskRepository.findById(task1Id).orElseThrow();
        assertThat(doneTask.getStatus()).isEqualTo("Done");
        assertThat(doneTask.getDoneAt()).isNotNull();

        // Verify Goal progress updated in DB (50% complete because 1 of 2 tasks is Done)
        Goal updatedGoal = goalRepository.findById(goal.getId()).orElseThrow();
        assertThat(updatedGoal.getProgressPct()).isEqualTo(50);

        // 6. Unconfirm Plan
        DailyPlanDto unconfirmedDto = dailyPlanService.unconfirmPlan(today, testUser.getId());
        assertThat(unconfirmedDto.isConfirmed()).isFalse();

        // 7. Review Plan (Review task 2 -> TODAY for tomorrow)
        LocalDate tomorrow = today.plusDays(1);
        ReviewPlanRequest reviewRequest = new ReviewPlanRequest(
                tomorrow,
                List.of(
                        new ReviewPlanRequest.TaskReviewItem(task2Id, "TODAY")
                )
        );

        DailyPlanDto reviewedDto = dailyPlanService.reviewPlan(today, reviewRequest, testUser.getId());
        assertThat(reviewedDto.isReviewed()).isTrue();

        // Verify tomorrow's plan contains task 2
        DailyPlanDto tomorrowPlan = dailyPlanService.getDailyPlan(tomorrow, testUser.getId());
        assertThat(tomorrowPlan).isNotNull();
        assertThat(tomorrowPlan.tasks()).anyMatch(t -> t.task().id().equals(task2Id));

        // 8. Cancel Today's Plan
        dailyPlanService.cancelPlan(today, testUser.getId());
        DailyPlanDto cancelledPlan = dailyPlanService.getDailyPlan(today, testUser.getId());
        assertThat(cancelledPlan).isNull();
    }

    @Test
    @DisplayName("Integration Test: Get Unreviewed Plan Range Query")
    void testUnreviewedPlanIntegration() {
        LocalDate pastDate = today.minusDays(2);
        DailyPlan pastPlan = new DailyPlan();
        pastPlan.setUserId(testUser.getId());
        pastPlan.setPlanDate(pastDate);
        pastPlan.setAvailableMinutes(120);
        pastPlan.setIsConfirmed(true);
        pastPlan.setIsReviewed(false);
        dailyPlanRepository.save(pastPlan);

        DailyPlanDto unreviewed = dailyPlanService.getUnreviewedPlan(today, testUser.getId());
        assertThat(unreviewed).isNotNull();
        assertThat(unreviewed.planDate()).isEqualTo(pastDate);
    }
}
