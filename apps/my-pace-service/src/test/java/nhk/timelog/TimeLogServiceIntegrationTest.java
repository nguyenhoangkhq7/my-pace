package nhk.timelog;

import nhk.BaseIntegrationTest;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.timelog.dto.CreateTimeLogRequest;
import nhk.timelog.dto.TimeLogResponse;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class TimeLogServiceIntegrationTest extends BaseIntegrationTest {

    @MockitoBean
    private nhk.mail.SendOtpMailService sendOtpMailService;

    @Autowired
    private TimeLogServiceImpl timeLogService;

    @Autowired
    private TimeLogRepository timeLogRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    private User sampleUser;
    private Task sampleTask;

    @BeforeEach
    void setUp() {
        timeLogRepository.deleteAll();
        taskRepository.deleteAll();
        userRepository.deleteAll();

        sampleUser = new User();
        sampleUser.setEmail("timelog_" + UUID.randomUUID() + "@test.com");
        sampleUser.setPasswordHash("hash");
        sampleUser.setFullName("Test User");
        sampleUser.setRole(Role.USER);
        sampleUser.setTimezone("Asia/Ho_Chi_Minh");
        sampleUser = userRepository.save(sampleUser);

        sampleTask = new Task();
        sampleTask.setUserId(sampleUser.getId());
        sampleTask.setTitle("Test Task");
        sampleTask.setActualMinutes(0);
        sampleTask = taskRepository.save(sampleTask);
    }

    private CreateTimeLogRequest buildRequest(UUID taskId, OffsetDateTime start, OffsetDateTime end, int minutes) {
        return new CreateTimeLogRequest(null, taskId, minutes, start, end);
    }

    private TimeLog saveLog(UUID userId, UUID taskId, OffsetDateTime start, OffsetDateTime end, int minutes) {
        TimeLog tl = new TimeLog();
        tl.setUserId(userId);
        tl.setTaskId(taskId);
        tl.setStartedAt(start);
        tl.setEndedAt(end);
        tl.setLoggedMinutes(minutes);
        tl.setCreatedAt(OffsetDateTime.now().minusSeconds(5));
        return timeLogRepository.save(tl);
    }

    @Nested
    @DisplayName("createTimeLog")
    class CreateTimeLog {
        @Test
        void happyPath_createsLogAndUpdatesTask() {
            OffsetDateTime start = OffsetDateTime.now();
            OffsetDateTime end = start.plusMinutes(45);
            CreateTimeLogRequest request = buildRequest(sampleTask.getId(), start, end, 45);

            TimeLogResponse response = timeLogService.createTimeLog(request, sampleUser.getId());

            assertThat(response).isNotNull();
            assertThat(response.loggedMinutes()).isEqualTo(45);

            List<TimeLog> logs = timeLogRepository.findAll();
            assertThat(logs).hasSize(1);
            assertThat(logs.get(0).getLoggedMinutes()).isEqualTo(45);

            Task updatedTask = taskRepository.findById(sampleTask.getId()).orElseThrow();
            assertThat(updatedTask.getActualMinutes()).isEqualTo(45);
        }

        @Test
        void overlapTrimmed_whenOverlappingLogExists() {
            OffsetDateTime start = OffsetDateTime.now(); // 10:00
            saveLog(sampleUser.getId(), sampleTask.getId(), start, start.plusMinutes(60), 60);

            // New log from 10:30 to 11:30 (overlaps by 30 mins)
            CreateTimeLogRequest request = buildRequest(
                    sampleTask.getId(),
                    start.plusMinutes(30),
                    start.plusMinutes(90),
                    60
            );

            TimeLogResponse response = timeLogService.createTimeLog(request, sampleUser.getId());

            assertThat(response.loggedMinutes()).isEqualTo(30);

            Task updatedTask = taskRepository.findById(sampleTask.getId()).orElseThrow();
            assertThat(updatedTask.getActualMinutes()).isEqualTo(90); // 60 + 30
        }
    }

    @Nested
    @DisplayName("getDailySummary")
    class GetDailySummary {
        @Test
        void sumsCorrectlyForSameDay() {
            ZoneId tz = ZoneId.of("Asia/Ho_Chi_Minh");
            LocalDate today = LocalDate.now(tz);
            OffsetDateTime baseTime = today.atTime(10, 0).atZone(tz).toOffsetDateTime();

            saveLog(sampleUser.getId(), sampleTask.getId(), baseTime, baseTime.plusMinutes(30), 30);
            saveLog(sampleUser.getId(), sampleTask.getId(), baseTime.plusHours(2), baseTime.plusHours(2).plusMinutes(45), 45);

            int total = timeLogService.getDailySummary(sampleUser.getId(), today.toString(), tz);
            assertThat(total).isEqualTo(75);
        }

        @Test
        void differentDay_returnsZero() {
            ZoneId tz = ZoneId.of("Asia/Ho_Chi_Minh");
            LocalDate today = LocalDate.now(tz);
            OffsetDateTime yesterday = today.minusDays(1).atTime(10, 0).atZone(tz).toOffsetDateTime();

            saveLog(sampleUser.getId(), sampleTask.getId(), yesterday, yesterday.plusMinutes(30), 30);

            int total = timeLogService.getDailySummary(sampleUser.getId(), today.toString(), tz);
            assertThat(total).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("deleteTimeLog")
    class DeleteTimeLog {
        @Test
        void recalculatesActualMinutes() {
            TimeLog log1 = saveLog(sampleUser.getId(), sampleTask.getId(), OffsetDateTime.now(), OffsetDateTime.now().plusMinutes(30), 30);
            saveLog(sampleUser.getId(), sampleTask.getId(), OffsetDateTime.now(), OffsetDateTime.now().plusMinutes(45), 45);

            // Manual sync of task actualMinutes since we bypassed service
            sampleTask.setActualMinutes(75);
            taskRepository.save(sampleTask);

            timeLogService.deleteTimeLog(log1.getId(), sampleUser.getId());

            Task updatedTask = taskRepository.findById(sampleTask.getId()).orElseThrow();
            assertThat(updatedTask.getActualMinutes()).isEqualTo(45);
        }
    }
}
