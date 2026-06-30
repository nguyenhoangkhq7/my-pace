package nhk.planning;

import lombok.Data;
import nhk.task.TaskDto;
import nhk.timeblock.TaskTimeBlockDto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class DailyPlanDto {
    private UUID id;
    private UUID userId;
    private LocalDate planDate;
    private Integer availableMinutes;
    private Boolean isConfirmed;
    private OffsetDateTime confirmedAt;
    private List<DailyPlanTaskDto> tasks;
    private List<TaskTimeBlockDto> timeBlocks;
}

@Data
class DailyPlanTaskDto {
    private UUID id;
    private UUID dailyPlanId;
    private TaskDto task;
    private Boolean isMit;
    private Integer sortOrder;
}
