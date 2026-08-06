package nhk.quickadd;

import java.time.LocalTime;

/**
 * Classifies whether a parsed extraction represents a "task" or "event".
 *
 * Decision is based entirely on RESOLVED DATA, not on LLM's literal "type" or "intent" field.
 *
 * Rules (evaluated in order):
 *   1. startTime resolved successfully    → "event" (time block)
 *   2. allDayHint = true                 → "event" (all-day event)
 *   3. timeExpression present but failed → "event" (intent is clear)
 *   4. Default                           → "task"
 *
 * Rationale: LLM 8B models frequently misclassify task vs event. Basing the decision on
 * concrete resolved signals (startTime, allDayHint) is 100% deterministic.
 */
class IntentClassifier {

    String classify(AiExtraction extraction, LocalTime resolvedStartTime) {
        // Primary: a resolved startTime is the strongest signal
        if (resolvedStartTime != null) return "event";

        // All-day event: user explicitly said "cả ngày", "nghỉ lễ", "all day" etc.
        if (extraction.allDayHint()) return "event";

        // Secondary: user wrote a time expression even if we couldn't parse it
        if (hasTimeExpression(extraction)) return "event";

        return "task";
    }

    private boolean hasTimeExpression(AiExtraction extraction) {
        return extraction.timeExpression() != null && !extraction.timeExpression().isBlank();
    }
}
