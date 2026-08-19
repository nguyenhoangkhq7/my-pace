package nhk.planning.insight;

import java.time.LocalDate;
import java.util.List;

public record DailyBriefingResponse(
    LocalDate date,
    int availableMinutes,
    int scheduledMinutes,
    int fillPercentage,
    int taskCount,
    int mitCount,
    int habitSessionCount,
    List<BriefingTaskItem> tasks,
    List<BriefingAlert> alerts,
    int currentStreak,
    List<GoalProgression> goalProgressions,
    boolean willClearAllOverdue
) {}
