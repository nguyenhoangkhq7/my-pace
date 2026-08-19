package nhk.planning.insight;

import java.time.LocalDate;
import java.util.UUID;

public record GoalProgression(
    UUID goalId,
    String goalTitle,
    int currentPct,
    int projectedPct,
    int todayTaskCount,
    LocalDate endDate,
    int daysRemaining
) {}
