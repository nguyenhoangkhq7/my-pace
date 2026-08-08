package nhk.scheduling;

import nhk.task.Task;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public record TaskQueueResult(
        Map<LocalDate, List<TaskQueueItem>> dateTaskQueues,
        List<TaskQueueItem> backlogQueue,
        Set<LocalDate> datesWithDailyPlan,
        Map<UUID, Task> userTaskMap
) {}
