package nhk.stats;

import lombok.Builder;
import java.util.List;
import java.util.Map;

@Builder
public record StatsResponse(
    Map<String, Integer> matrixTime,
    Map<String, Integer> categoryTime,
    Double completionRate,
    Integer streak,
    Integer totalPlannedMinutes,
    Integer totalActualMinutes,
    Double estimationAccuracy,
    Double q2FocusRatio,
    Double rolloverRate,
    List<DailyTimeStat> dailyTimeStats,
    Map<Integer, Integer> hourlyFocusMinutes
) {
    public record DailyTimeStat(
        String date,
        Integer plannedMinutes,
        Integer actualMinutes
    ) {}
}


