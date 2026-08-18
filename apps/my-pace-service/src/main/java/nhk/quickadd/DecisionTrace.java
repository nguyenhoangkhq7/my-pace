package nhk.quickadd;

import java.util.List;
import java.util.Map;

/**
 * Internal-first decision trace recording why a task or event was classified into a specific Eisenhower quadrant.
 * Used for debugging, logging, and future audit/explainability without exposing unnecessary details to the frontend.
 */
public record DecisionTrace(
        int importanceScore,
        int urgencyScore,
        List<String> signals,
        Map<String, Object> sources
) {}
