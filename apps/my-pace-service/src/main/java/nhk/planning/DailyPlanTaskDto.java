package nhk.planning;

import nhk.task.TaskDto;
import java.util.UUID;

public record DailyPlanTaskDto(
    UUID id,
    UUID dailyPlanId,
    TaskDto task,
    Boolean isMit,
    Integer sortOrder,
    String escalationReason
) {}
