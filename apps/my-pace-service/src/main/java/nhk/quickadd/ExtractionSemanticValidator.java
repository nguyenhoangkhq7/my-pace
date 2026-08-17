package nhk.quickadd;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Semantic / meaning validator for AI extractions.
 * Sanitizes expressions and resolves contradictory fields before they reach the deterministic resolvers.
 */
@Component
public class ExtractionSemanticValidator {

    private static final Pattern VALID_DURATION_PATTERN = Pattern.compile(
            ".*\\b(?:\\d+\\s*(?:tiếng|tieng|phút|phut|giờ|gio|h|p|m|min|mins|minute|minutes|hour|hours|hr|hrs|giây|s)|tiếng rưỡi|tieng ruoi|nửa tiếng|nua tieng|nửa giờ|nua gio|1 tiếng|1 giờ)\\b.*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Pattern VALID_RECURRENCE_PATTERN = Pattern.compile(
            ".*\\b(?:hàng|hang|mỗi|moi|every|daily|weekly|monthly|thứ|thu|chủ nhật|chu nhat|ngày|ngay|tuần|tuan|lặp lại|lap lai)\\b.*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final int MAX_EXPRESSION_LENGTH = 120;
    private static final int MAX_NOTES_LENGTH = 1000;

    /**
     * Validates and cleans semantic values in the extraction.
     */
    public AiExtraction validate(AiExtraction extraction, String rawText) {
        if (extraction == null) return null;

        String sanitizedDuration = sanitizeDuration(extraction.durationExpression());
        String sanitizedRecurrence = sanitizeRecurrence(extraction.recurrenceExpression());
        String sanitizedDate = sanitizeExpression(extraction.dateExpression());
        String sanitizedTime = sanitizeExpression(extraction.timeExpression());
        String sanitizedCategoryHint = sanitizeExpression(extraction.categoryHint());
        String sanitizedGoalHint = sanitizeExpression(extraction.goalHint());
        String sanitizedNotes = sanitizeNotes(extraction.notes());

        boolean allDay = extraction.allDayHint();
        // If allDay is true but rawText specifies a distinct time range (and never mentioned all-day), check consistency
        if (allDay && sanitizedTime != null && (sanitizedTime.contains("-") || sanitizedTime.contains("–"))) {
            if (rawText != null && !rawText.toLowerCase().matches(".*\\b(?:ca ngay|cả ngày|all day|nghi le|nghỉ lễ)\\b.*")) {
                allDay = false;
            }
        }

        return new AiExtraction(
                extraction.reasoning(),
                extraction.intent(),
                extraction.title(),
                sanitizedDate,
                sanitizedTime,
                sanitizedDuration,
                sanitizedCategoryHint,
                sanitizedGoalHint,
                sanitizedNotes,
                extraction.checklists(),
                allDay,
                sanitizedRecurrence,
                extraction.i(),
                extraction.u()
        );
    }

    private String sanitizeDuration(String expr) {
        if (expr == null || expr.isBlank()) return null;
        String trimmed = expr.trim();
        if (trimmed.length() > MAX_EXPRESSION_LENGTH) {
            trimmed = trimmed.substring(0, MAX_EXPRESSION_LENGTH);
        }
        if (!VALID_DURATION_PATTERN.matcher(trimmed).matches()) {
            return null;
        }
        return trimmed;
    }

    private String sanitizeRecurrence(String expr) {
        if (expr == null || expr.isBlank()) return null;
        String trimmed = expr.trim();
        if (trimmed.length() > MAX_EXPRESSION_LENGTH) {
            trimmed = trimmed.substring(0, MAX_EXPRESSION_LENGTH);
        }
        if (!VALID_RECURRENCE_PATTERN.matcher(trimmed).matches()) {
            return null;
        }
        return trimmed;
    }

    private String sanitizeExpression(String expr) {
        if (expr == null || expr.isBlank()) return null;
        String trimmed = expr.trim();
        if (trimmed.length() > MAX_EXPRESSION_LENGTH) {
            return trimmed.substring(0, MAX_EXPRESSION_LENGTH).trim();
        }
        return trimmed;
    }

    private String sanitizeNotes(String notes) {
        if (notes == null || notes.isBlank()) return null;
        String trimmed = notes.trim();
        if (trimmed.length() > MAX_NOTES_LENGTH) {
            return trimmed.substring(0, MAX_NOTES_LENGTH).trim();
        }
        return trimmed;
    }
}
