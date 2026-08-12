package nhk.timelog;

import nhk.BaseIntegrationTest;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class TimeLogRepositoryIntegrationTest extends BaseIntegrationTest {

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
        sampleUser.setEmail("repo_" + UUID.randomUUID() + "@test.com");
        sampleUser.setPasswordHash("hash");
        sampleUser.setFullName("Test User");
        sampleUser.setRole(Role.USER);
        sampleUser = userRepository.save(sampleUser);

        sampleTask = new Task();
        sampleTask.setUserId(sampleUser.getId());
        sampleTask.setTitle("Test Task");
        sampleTask = taskRepository.save(sampleTask);
    }

    private TimeLog saveLog(UUID userId, UUID taskId, OffsetDateTime start, OffsetDateTime end, int minutes) {
        TimeLog tl = new TimeLog();
        tl.setUserId(userId);
        tl.setTaskId(taskId);
        tl.setStartedAt(start);
        tl.setEndedAt(end);
        tl.setLoggedMinutes(minutes);
        tl.setCreatedAt(OffsetDateTime.now());
        return timeLogRepository.save(tl);
    }

    @Test
    void findOverlapping_fullyOverlapping_returnsLog() {
        OffsetDateTime start = OffsetDateTime.now(); // 10:00
        OffsetDateTime end = start.plusMinutes(60);  // 11:00
        saveLog(sampleUser.getId(), sampleTask.getId(), start, end, 60);

        List<TimeLog> overlaps = timeLogRepository.findOverlapping(
                sampleUser.getId(),
                start.minusMinutes(30), // 09:30
                start.plusMinutes(30)   // 10:30
        );

        assertThat(overlaps).hasSize(1);
    }

    @Test
    void findOverlapping_noOverlap_returnsEmpty() {
        OffsetDateTime start = OffsetDateTime.now();
        OffsetDateTime end = start.plusMinutes(60);
        saveLog(sampleUser.getId(), sampleTask.getId(), start, end, 60);

        List<TimeLog> overlaps = timeLogRepository.findOverlapping(
                sampleUser.getId(),
                end,
                end.plusMinutes(60)
        );

        assertThat(overlaps).isEmpty();
    }

    @Test
    void findHourlyFocusMinutes_groupsCorrectly() {
        ZoneId tz = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDate today = LocalDate.now(tz);

        OffsetDateTime morning = today.atTime(9, 30).atZone(tz).toOffsetDateTime();
        OffsetDateTime afternoon = today.atTime(14, 0).atZone(tz).toOffsetDateTime();

        saveLog(sampleUser.getId(), sampleTask.getId(), morning, morning.plusMinutes(30), 30);
        saveLog(sampleUser.getId(), sampleTask.getId(), afternoon, afternoon.plusMinutes(45), 45);

        OffsetDateTime rangeStart = today.atStartOfDay(tz).toOffsetDateTime();
        OffsetDateTime rangeEnd = today.atTime(23, 59, 59).atZone(tz).toOffsetDateTime();

        List<Object[]> hourly = timeLogRepository.findHourlyFocusMinutes(
                sampleUser.getId(),
                rangeStart,
                rangeEnd,
                "Asia/Ho_Chi_Minh"
        );

        assertThat(hourly).hasSize(2);
        
        boolean foundMorning = false;
        boolean foundAfternoon = false;
        
        for (Object[] row : hourly) {
            int hour = ((Number) row[0]).intValue();
            int minutes = ((Number) row[1]).intValue();
            
            if (hour == 9) {
                assertThat(minutes).isEqualTo(30);
                foundMorning = true;
            } else if (hour == 14) {
                assertThat(minutes).isEqualTo(45);
                foundAfternoon = true;
            }
        }
        
        assertThat(foundMorning).isTrue();
        assertThat(foundAfternoon).isTrue();
    }
}
