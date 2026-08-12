package nhk.timelog;

import jakarta.persistence.EntityNotFoundException;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.timeblock.TaskTimeBlockRepository;
import nhk.timelog.dto.CreateTimeLogRequest;
import nhk.timelog.dto.TimeLogResponse;
import nhk.timelog.dto.UpdateTimeLogRequest;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TimeLogServiceImplTest {

    @Mock
    private TimeLogRepository timeLogRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskTimeBlockRepository taskTimeBlockRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TimeLogServiceImpl timeLogService;

    private UUID userId;
    private UUID taskId;
    private Task sampleTask;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        taskId = UUID.randomUUID();

        sampleTask = new Task();
        sampleTask.setId(taskId);
        sampleTask.setUserId(userId);
        sampleTask.setTitle("Test Task");
        sampleTask.setActualMinutes(0);
    }

    private TimeLog buildTimeLog(UUID userId, UUID taskId, OffsetDateTime start, OffsetDateTime end, int minutes) {
        TimeLog tl = new TimeLog();
        tl.setId(UUID.randomUUID());
        tl.setUserId(userId);
        tl.setTaskId(taskId);
        tl.setStartedAt(start);
        tl.setEndedAt(end);
        tl.setLoggedMinutes(minutes);
        return tl;
    }

    @Nested
    @DisplayName("createTimeLog")
    class CreateTimeLog {

        @Test
        void happyPath_createsLogAndUpdateTask() {
            OffsetDateTime start = OffsetDateTime.now();
            OffsetDateTime end = start.plusMinutes(60);
            CreateTimeLogRequest request = new CreateTimeLogRequest(null, taskId, 60, start, end);

            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            when(timeLogRepository.findOverlapping(userId, start, end)).thenReturn(Collections.emptyList());
            
            TimeLog savedLog = buildTimeLog(userId, taskId, start, end, 60);
            when(timeLogRepository.save(any(TimeLog.class))).thenReturn(savedLog);
            when(timeLogRepository.sumLoggedMinutesByTaskId(taskId)).thenReturn(60);

            TimeLogResponse response = timeLogService.createTimeLog(request, userId);

            assertThat(response).isNotNull();
            assertThat(response.loggedMinutes()).isEqualTo(60);

            ArgumentCaptor<TimeLog> logCaptor = ArgumentCaptor.forClass(TimeLog.class);
            verify(timeLogRepository).save(logCaptor.capture());
            assertThat(logCaptor.getValue().getLoggedMinutes()).isEqualTo(60);

            verify(taskRepository).save(sampleTask);
            assertThat(sampleTask.getActualMinutes()).isEqualTo(60);
        }

        @Test
        void taskNotBelongingToUser_throwsException() {
            CreateTimeLogRequest request = new CreateTimeLogRequest(null, taskId, 60, OffsetDateTime.now(), OffsetDateTime.now());
            sampleTask.setUserId(UUID.randomUUID()); // Different user
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));

            assertThatThrownBy(() -> timeLogService.createTimeLog(request, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Task not found or doesn't belong to user");
        }

        @Test
        void withOverlap_trimsLoggedMinutes() {
            OffsetDateTime start = OffsetDateTime.now(); // 10:00
            OffsetDateTime end = start.plusMinutes(60); // 11:00
            CreateTimeLogRequest request = new CreateTimeLogRequest(null, taskId, 60, start, end);

            // Existing log overlaps by 30 minutes (10:30 to 11:30)
            TimeLog existing = buildTimeLog(userId, taskId, start.plusMinutes(30), end.plusMinutes(30), 60);

            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            when(timeLogRepository.findOverlapping(userId, start, end)).thenReturn(List.of(existing));
            
            TimeLog savedLog = buildTimeLog(userId, taskId, start, end, 30); // trimmed
            when(timeLogRepository.save(any(TimeLog.class))).thenReturn(savedLog);
            when(timeLogRepository.sumLoggedMinutesByTaskId(taskId)).thenReturn(30);

            TimeLogResponse response = timeLogService.createTimeLog(request, userId);

            ArgumentCaptor<TimeLog> logCaptor = ArgumentCaptor.forClass(TimeLog.class);
            verify(timeLogRepository).save(logCaptor.capture());
            assertThat(logCaptor.getValue().getLoggedMinutes()).isEqualTo(30); // 60 - 30
        }
    }

    @Nested
    @DisplayName("updateTimeLog")
    class UpdateTimeLog {

        @Test
        void updatesLogAndRecalculatesTask() {
            UUID logId = UUID.randomUUID();
            OffsetDateTime end = OffsetDateTime.now();
            UpdateTimeLogRequest request = new UpdateTimeLogRequest(45, end);
            
            TimeLog existingLog = buildTimeLog(userId, taskId, end.minusMinutes(30), end.minusMinutes(30), 30);
            
            when(timeLogRepository.findById(logId)).thenReturn(Optional.of(existingLog));
            when(timeLogRepository.save(any(TimeLog.class))).thenReturn(existingLog);
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            when(timeLogRepository.sumLoggedMinutesByTaskId(taskId)).thenReturn(45);

            TimeLogResponse response = timeLogService.updateTimeLog(logId, request, userId);

            assertThat(response).isNotNull();
            assertThat(response.loggedMinutes()).isEqualTo(45);

            verify(timeLogRepository).save(existingLog);
            assertThat(existingLog.getLoggedMinutes()).isEqualTo(45);
            assertThat(existingLog.getEndedAt()).isEqualTo(end);

            verify(taskRepository).save(sampleTask);
            assertThat(sampleTask.getActualMinutes()).isEqualTo(45);
        }

        @Test
        void logNotBelongingToUser_throwsException() {
            UUID logId = UUID.randomUUID();
            OffsetDateTime end = OffsetDateTime.now();
            UpdateTimeLogRequest request = new UpdateTimeLogRequest(45, end);
            
            TimeLog existingLog = buildTimeLog(UUID.randomUUID(), taskId, end, end, 30); // Different user
            when(timeLogRepository.findById(logId)).thenReturn(Optional.of(existingLog));

            assertThatThrownBy(() -> timeLogService.updateTimeLog(logId, request, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("TimeLog not found or doesn't belong to user");
        }
    }

    @Nested
    @DisplayName("getDailySummary")
    class GetDailySummary {
        @Test
        void returnsMinutesFromRepository() {
            String dateStr = "2023-10-15";
            ZoneId zoneId = ZoneId.of("UTC");
            
            when(timeLogRepository.sumLoggedMinutesByUserIdAndDateRange(eq(userId), any(), any())).thenReturn(75);
            
            int total = timeLogService.getDailySummary(userId, dateStr, zoneId);
            
            assertThat(total).isEqualTo(75);
        }

        @Test
        void whenRepositoryReturnsNull_returnsZero() {
            String dateStr = "2023-10-15";
            ZoneId zoneId = ZoneId.of("UTC");
            
            when(timeLogRepository.sumLoggedMinutesByUserIdAndDateRange(eq(userId), any(), any())).thenReturn(null);
            
            int total = timeLogService.getDailySummary(userId, dateStr, zoneId);
            
            assertThat(total).isEqualTo(0);
        }
    }
    
    @Nested
    @DisplayName("deleteTimeLog")
    class DeleteTimeLog {
        @Test
        void deletesLogAndRecalculatesTask() {
            UUID logId = UUID.randomUUID();
            TimeLog tl = buildTimeLog(userId, taskId, OffsetDateTime.now(), OffsetDateTime.now(), 30);
            
            when(timeLogRepository.findById(logId)).thenReturn(Optional.of(tl));
            when(taskRepository.findById(taskId)).thenReturn(Optional.of(sampleTask));
            when(timeLogRepository.sumLoggedMinutesByTaskId(taskId)).thenReturn(15);
            
            timeLogService.deleteTimeLog(logId, userId);
            
            verify(timeLogRepository).delete(tl);
            verify(taskRepository).save(sampleTask);
            assertThat(sampleTask.getActualMinutes()).isEqualTo(15);
        }

        @Test
        void logNotBelongingToUser_throwsException() {
            UUID logId = UUID.randomUUID();
            TimeLog tl = buildTimeLog(UUID.randomUUID(), taskId, OffsetDateTime.now(), OffsetDateTime.now(), 30);
            
            when(timeLogRepository.findById(logId)).thenReturn(Optional.of(tl));
            
            assertThatThrownBy(() -> timeLogService.deleteTimeLog(logId, userId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("TimeLog not found or doesn't belong to user");
        }
    }
}
