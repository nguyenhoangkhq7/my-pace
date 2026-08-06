package nhk.scheduling;

import nhk.timeblock.TaskTimeBlockDto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record AutoScheduleResponse(
    LocalDate startDate,
    LocalDate endDate,
    Map<LocalDate, List<TaskTimeBlockDto>> schedule,
    Integer overflowMinutes,
    Boolean isOverscheduled
) {}
