package nhk.scheduling;

import nhk.calendar.FixedEventService;
import nhk.mail.SendOtpMailService;
import nhk.planning.DailyPlan;
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
    "spring.datasource.url=jdbc:h2:mem:testdb_scheduling;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.flyway.enabled=false"
})
@Transactional
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

        AutoScheduleResponse response = autoScheduleService.autoScheduleWeek(
                testUser.getId(), today, 10, false
        );

        assertThat(response).isNotNull();
        assertThat(response.schedule()).isNotNull();
        assertThat(response.schedule()).containsKey(today);

        List<TaskTimeBlock> savedBlocks = timeBlockRepository.findByUserIdAndDateRange(
                testUser.getId(), today.atStartOfDay(), today.plusDays(7).atStartOfDay()
        );
        assertThat(savedBlocks).isNotEmpty();
    }
}
