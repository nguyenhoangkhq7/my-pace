package nhk.timelog;

import nhk.timelog.dto.CreateTimeLogRequest;
import nhk.timelog.dto.TimeLogResponse;
import nhk.timelog.dto.UpdateTimeLogRequest;

import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

public interface TimeLogService {
    TimeLogResponse createTimeLog(CreateTimeLogRequest request, UUID userId);
    List<TimeLogResponse> getByTimeBlockId(UUID timeBlockId, UUID userId);
    List<TimeLogResponse> getByTaskId(UUID taskId, UUID userId);
    TimeLogResponse updateTimeLog(UUID id, UpdateTimeLogRequest request, UUID userId);
    void deleteTimeLog(UUID id, UUID userId);
    int getDailySummary(UUID userId, String date, ZoneId zoneId);
}
