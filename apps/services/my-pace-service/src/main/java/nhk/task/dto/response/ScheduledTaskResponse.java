package nhk.task.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ScheduledTaskResponse(
        Integer id,
        Integer taskId,
        String taskTitle,
        String categoryName,
        String categoryColor,
        LocalDateTime startTime,
        LocalDateTime endTime,
        LocalDate dateApplied,
        TaskResponse task
) {
}

