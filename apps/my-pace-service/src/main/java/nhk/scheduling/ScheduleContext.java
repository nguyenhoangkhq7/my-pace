package nhk.scheduling;

import nhk.category.Category;
import nhk.goal.Goal;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanTask;
import nhk.task.Task;
import nhk.timeblock.TaskTimeBlock;
import nhk.user.User;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ScheduleContext(
        UUID userId,
        ZoneId zoneId,
        LocalDate startDate,
        LocalDate endDate,
        List<LocalDate> dateRange,
        int bufferMinutes,
        int wakeMin,
        int sleepMin,
        Map<UUID, Category> categoryMap,
        Map<LocalDate, DailyPlan> planMap,
        Map<LocalDate, List<TaskTimeBlock>> taskTimeBlocksByDate,
        Map<UUID, List<DailyPlanTask>> dailyPlanTasksByPlanId,
        Map<UUID, Goal> goalMap,
        List<Task> activeTasks,
        Map<UUID, List<TaskTimeBlock>> taskTimeBlocksByTaskId
) {}
