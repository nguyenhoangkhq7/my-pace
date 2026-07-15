package nhk.stats;

import lombok.Builder;
import java.util.Map;

@Builder
public record StatsResponse(
    Map<String, Integer> matrixTime,
    Map<String, Integer> categoryTime,
    Double completionRate,
    Integer streak
) {}
