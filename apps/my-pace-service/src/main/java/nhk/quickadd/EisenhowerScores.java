package nhk.quickadd;

import java.util.Map;

/**
 * Encapsulates deterministic scores calculated for importance and urgency,
 * along with the breakdown of score contributions.
 */
public record EisenhowerScores(
        int importanceScore,
        int urgencyScore,
        Map<String, Integer> scoreBreakdown
) {
    public EisenhowerScores {
        scoreBreakdown = scoreBreakdown != null ? Map.copyOf(scoreBreakdown) : Map.of();
    }
}
