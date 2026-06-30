package nhk.planning;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import nhk.task.TaskDto;

@Data
public class DailyPlanDto {
    private UUID id;
    private UUID userId;
    private LocalDate planDate;
    private Integer availableMinutes;
    private Boolean isConfirmed;
    private OffsetDateTime confirmedAt;
    private List<DailyPlanTaskDto> tasks;
}

@Data
class DailyPlanTaskDto {
    private UUID id;
    private UUID dailyPlanId;
    private TaskDto task;
    private Boolean isMit;
    private Integer sortOrder;
    private LocalTime scheduledStartTime;
    private LocalTime scheduledEndTime;
}
