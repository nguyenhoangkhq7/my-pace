package nhk.scheduling;

import nhk.calendar.FixedEventService;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import nhk.mail.SendOtpMailService;
import nhk.planning.DailyPlanRepository;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.timeblock.TaskTimeBlock;
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
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = {
    "RESEND_API_KEY=test-api-key",
    "JWT_SECRET=test-jwt-secret-with-at-least-256-bits-length-so-it-does-not-fail-validation"
})
class AutoScheduleIntegrationTest {

    @Autowired
    private AutoScheduleService autoScheduleService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private DailyPlanRepository dailyPlanRepository;

    @Autowired
    private GoalRepository goalRepository;

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
        testUser.setEmail("scheduler_" + UUID.randomUUID() + "@test.com");
        testUser.setPasswordHash("password123");
        testUser.setFullName("Scheduler User");
        testUser.setTimezone("Asia/Ho_Chi_Minh");
        testUser.setWakeTime(LocalTime.of(7, 0));
        testUser.setSleepTime(LocalTime.of(23, 0));
        testUser = userRepository.save(testUser);
    }

    @Test
    @DisplayName("Integration Test: Auto Schedule Week with Reclaim Engine")
    void testAutoScheduleWeekIntegration() {
        Task backlogTask = new Task();
        backlogTask.setUserId(testUser.getId());
        backlogTask.setTitle("Important Deep Work Task");
        backlogTask.setEstimatedMinutes(120);
        backlogTask.setStatus("Backlog");
        backlogTask.setIsImportant(true);
        backlogTask.setIsUrgent(true);
        taskRepository.save(backlogTask);

        AutoScheduleResponse response = autoScheduleService.autoSchedule(
                testUser.getId(), 10
        );

        assertThat(response).isNotNull();
        assertThat(response.schedule()).isNotNull();
        LocalDate now = LocalDate.now(java.time.ZoneId.of(testUser.getTimezone()));
        assertThat(response.schedule()).containsKey(now);

        List<TaskTimeBlock> savedBlocks = timeBlockRepository.findByUserIdAndDateRange(
                testUser.getId(), now.atStartOfDay(), now.plusDays(7).atStartOfDay()
        );
        assertThat(savedBlocks).isNotEmpty();
    }

    @Test
    @DisplayName("Integration Test: Smart Spillover Visa (Time-boxed vs Milestone)")
    void testSmartSpilloverVisa() {
        // Create Time-boxed Goal
        Goal timeBoxedGoal = new Goal();
        timeBoxedGoal.setUserId(testUser.getId());
        timeBoxedGoal.setTitle("Học Tiếng Anh");
        timeBoxedGoal.setGoalType("Time-boxed");
        timeBoxedGoal = goalRepository.save(timeBoxedGoal);

        // Create a 24-hour Task for Time-boxed (Will definitely spillover if allowed)
        Task tbTask = new Task();
        tbTask.setUserId(testUser.getId());
        tbTask.setGoalId(timeBoxedGoal.getId());
        tbTask.setTitle("Học tiếng Anh hôm nay");
        tbTask.setEstimatedMinutes(1440); // 24 hours
        tbTask.setStatus("Backlog");
        taskRepository.save(tbTask);

        // Create Milestone Goal
        Goal milestoneGoal = new Goal();
        milestoneGoal.setUserId(testUser.getId());
        milestoneGoal.setTitle("Code tính năng mới");
        milestoneGoal.setGoalType("Milestone");
        milestoneGoal = goalRepository.save(milestoneGoal);

        // Create a 24-hour Task for Milestone (Will spillover)
        Task mTask = new Task();
        mTask.setUserId(testUser.getId());
        mTask.setGoalId(milestoneGoal.getId());
        mTask.setTitle("Làm backend");
        mTask.setEstimatedMinutes(1440); // 24 hours
        mTask.setStatus("Backlog");
        taskRepository.save(mTask);

        // Run auto schedule
        autoScheduleService.autoSchedule(testUser.getId(), 0);

        LocalDate now = LocalDate.now(java.time.ZoneId.of(testUser.getTimezone()));
        LocalDate tomorrow = now.plusDays(1);

        // Verify Time-boxed task is scheduled today, but NOT tomorrow (Visa denied)
        List<TaskTimeBlock> tbBlocksToday = timeBlockRepository.findByUserIdAndDateRange(
                testUser.getId(), now.atStartOfDay(), tomorrow.atStartOfDay()
        ).stream().filter(b -> b.getTaskId().equals(tbTask.getId())).toList();
        
        List<TaskTimeBlock> tbBlocksTomorrow = timeBlockRepository.findByUserIdAndDateRange(
                testUser.getId(), tomorrow.atStartOfDay(), tomorrow.plusDays(1).atStartOfDay()
        ).stream().filter(b -> b.getTaskId().equals(tbTask.getId())).toList();

        System.out.println("DEBUG tbBlocksToday: " + tbBlocksToday);
        System.out.println("DEBUG tbBlocksTomorrow: " + tbBlocksTomorrow);
        assertThat(tbBlocksToday).isNotEmpty();
        assertThat(tbBlocksTomorrow).isEmpty(); // Drop phần thừa!

        // Verify Milestone task is scheduled today AND tomorrow (Visa granted)
        List<TaskTimeBlock> mBlocksToday = timeBlockRepository.findByUserIdAndDateRange(
                testUser.getId(), now.atStartOfDay(), tomorrow.atStartOfDay()
        ).stream().filter(b -> b.getTaskId().equals(mTask.getId())).toList();
        
        List<TaskTimeBlock> mBlocksTomorrow = timeBlockRepository.findByUserIdAndDateRange(
                testUser.getId(), tomorrow.atStartOfDay(), tomorrow.plusDays(1).atStartOfDay()
        ).stream().filter(b -> b.getTaskId().equals(mTask.getId())).toList();

        System.out.println("DEBUG mBlocksToday: " + mBlocksToday);
        System.out.println("DEBUG mBlocksTomorrow: " + mBlocksTomorrow);

        assertThat(mBlocksToday).isEmpty(); // Bị tbTask chiếm hết giờ hôm nay!
        assertThat(mBlocksTomorrow).isNotEmpty(); // Được vắt sang ngày mai!
    }
}
