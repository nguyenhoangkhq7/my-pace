package nhk.timelog;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.timeblock.TaskTimeBlock;
import nhk.timeblock.TaskTimeBlockRepository;
import nhk.timelog.dto.CreateTimeLogRequest;
import nhk.timelog.dto.TimeLogResponse;
import nhk.timelog.dto.UpdateTimeLogRequest;
import nhk.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimeLogServiceImpl implements TimeLogService {

    private final TimeLogRepository timeLogRepository;
    private final TaskTimeBlockRepository taskTimeBlockRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public TimeLogResponse createTimeLog(CreateTimeLogRequest request, UUID userId) {
        // Anti-spam mechanism: prevent creating timelogs if the last one was created less than 2 seconds ago
        timeLogRepository.findTopByUserIdOrderByCreatedAtDesc(userId).ifPresent(lastLog -> {
            if (lastLog.getCreatedAt() != null && lastLog.getCreatedAt().plusSeconds(2).isAfter(OffsetDateTime.now())) {
                throw new IllegalStateException("Thao tác quá nhanh. Vui lòng đợi vài giây trước khi bấm Start tiếp.");
            }
        });

        if (request.timeBlockId() != null) {
            TaskTimeBlock timeBlock = taskTimeBlockRepository.findById(request.timeBlockId())
                    .orElseThrow(() -> new EntityNotFoundException("TaskTimeBlock not found"));
            if (!timeBlock.getTaskId().equals(request.taskId())) {
                throw new IllegalArgumentException("TimeBlock does not belong to the specified Task");
            }
        }
        
        Task task = taskRepository.findById(request.taskId())
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Task not found or doesn't belong to user"));

        // C2: Overlap detection — trim loggedMinutes to exclude time already covered by existing logs
        List<TimeLog> overlapping = timeLogRepository.findOverlapping(userId, request.startedAt(), request.endedAt());
        int adjustedMinutes = request.loggedMinutes();
        if (!overlapping.isEmpty()) {
            long overlapSeconds = 0;
            for (TimeLog existing : overlapping) {
                OffsetDateTime overlapStart = request.startedAt().isAfter(existing.getStartedAt()) ? request.startedAt() : existing.getStartedAt();
                OffsetDateTime overlapEnd = request.endedAt().isBefore(existing.getEndedAt()) ? request.endedAt() : existing.getEndedAt();
                if (overlapEnd.isAfter(overlapStart)) {
                    overlapSeconds += java.time.Duration.between(overlapStart, overlapEnd).getSeconds();
                }
            }
            int overlapMinutes = (int) Math.round(overlapSeconds / 60.0);
            adjustedMinutes = Math.max(0, request.loggedMinutes() - overlapMinutes);
        }

        TimeLog timeLog = new TimeLog();
        timeLog.setTimeBlockId(request.timeBlockId());
        timeLog.setTaskId(request.taskId());
        timeLog.setUserId(userId);
        timeLog.setLoggedMinutes(adjustedMinutes);
        timeLog.setStartedAt(request.startedAt());
        timeLog.setEndedAt(request.endedAt());
        
        TimeLog savedTimeLog = timeLogRepository.save(timeLog);

        Integer totalLogged = timeLogRepository.sumLoggedMinutesByTaskId(task.getId());
        task.setActualMinutes(totalLogged);
        taskRepository.save(task);

        return toResponse(savedTimeLog);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeLogResponse> getByTimeBlockId(UUID timeBlockId, UUID userId) {
        TaskTimeBlock timeBlock = taskTimeBlockRepository.findById(timeBlockId)
                .orElseThrow(() -> new EntityNotFoundException("TaskTimeBlock not found"));
        Task task = taskRepository.findById(timeBlock.getTaskId())
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Task not found or doesn't belong to user"));

        return timeLogRepository.findByTimeBlockIdOrderByStartedAtAsc(timeBlockId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeLogResponse> getByTaskId(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Task not found or doesn't belong to user"));

        return timeLogRepository.findByTaskIdOrderByStartedAtAsc(taskId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TimeLogResponse updateTimeLog(UUID id, UpdateTimeLogRequest request, UUID userId) {
        TimeLog timeLog = timeLogRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("TimeLog not found"));

        if (!timeLog.getUserId().equals(userId)) {
            throw new EntityNotFoundException("TimeLog not found or doesn't belong to user");
        }

        timeLog.setLoggedMinutes(request.loggedMinutes());
        timeLog.setEndedAt(request.endedAt());
        TimeLog savedTimeLog = timeLogRepository.save(timeLog);

        Task task = taskRepository.findById(timeLog.getTaskId())
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));
        Integer totalLogged = timeLogRepository.sumLoggedMinutesByTaskId(task.getId());
        task.setActualMinutes(totalLogged != null ? totalLogged : 0);
        taskRepository.save(task);

        return toResponse(savedTimeLog);
    }

    @Override
    @Transactional
    public void deleteTimeLog(UUID id, UUID userId) {
        TimeLog timeLog = timeLogRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("TimeLog not found"));

        if (!timeLog.getUserId().equals(userId)) {
            throw new EntityNotFoundException("TimeLog not found or doesn't belong to user");
        }

        UUID taskId = timeLog.getTaskId();
        timeLogRepository.delete(timeLog);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));
        Integer totalLogged = timeLogRepository.sumLoggedMinutesByTaskId(taskId);
        task.setActualMinutes(totalLogged);
        taskRepository.save(task);
    }

    // A3: Daily summary — sum logged minutes for a user on a specific local date
    @Override
    @Transactional(readOnly = true)
    public int getDailySummary(UUID userId, String date, ZoneId zoneId) {
        LocalDate localDate = LocalDate.parse(date);
        OffsetDateTime start = localDate.atStartOfDay(zoneId).toOffsetDateTime();
        OffsetDateTime end = localDate.atTime(23, 59, 59, 999999999).atZone(zoneId).toOffsetDateTime();
        Integer total = timeLogRepository.sumLoggedMinutesByUserIdAndDateRange(userId, start, end);
        return total != null ? total : 0;
    }

    private TimeLogResponse toResponse(TimeLog timeLog) {
        return new TimeLogResponse(
            timeLog.getId(),
            timeLog.getTimeBlockId(),
            timeLog.getTaskId(),
            timeLog.getLoggedMinutes(),
            timeLog.getStartedAt(),
            timeLog.getEndedAt(),
            timeLog.getCreatedAt()
        );
    }
}
