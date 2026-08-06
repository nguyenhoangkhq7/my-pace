package nhk.quickadd;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Deterministic resolver for Vietnamese/English recurrence expressions.
 * Converts raw strings into RecurrenceResult (type + days + endDate).
 * No AI — pure keyword matching.
 *
 * Examples:
 *   "hàng ngày"                      → DAILY
 *   "hàng tuần"  + eventDate=Mon     → WEEKLY, [1]
 *   "hàng tuần thứ 2, thứ 4, thứ 6" → WEEKLY, [1, 3, 5]
 *   null                             → NONE
 */
class RecurrenceResolver {

    RecurrenceResult resolve(String expression, LocalDate eventDate) {
        if (expression == null || expression.isBlank()) return RecurrenceResult.none();

        String norm = DateResolver.normalizeVietnamese(expression.toLowerCase());

        // DAILY
        if (containsAny(norm, "hang ngay", "moi ngay", "daily", "every day", "moi ngay")) {
            return new RecurrenceResult("DAILY", null, null);
        }

        // WEEKLY — try to extract explicit days first
        if (containsAny(norm, "hang tuan", "moi tuan", "weekly", "every week", "hang tuan")) {
            List<Integer> days = extractDaysOfWeek(norm);
            if (days.isEmpty() && eventDate != null) {
                // Fallback: use the day of week of the resolved event date
                days = List.of(eventDate.getDayOfWeek().getValue());
            }
            return new RecurrenceResult("WEEKLY", days.isEmpty() ? null : days, null);
        }

        // WEEKLY without explicit "hàng tuần" keyword but has multiple days
        List<Integer> days = extractDaysOfWeek(norm);
        if (!days.isEmpty()) {
            return new RecurrenceResult("WEEKLY", days, null);
        }

        return RecurrenceResult.none();
    }

    /**
     * Extracts day-of-week numbers (1=Mon…7=Sun) from a normalized expression.
     * Preserves insertion order, removes duplicates.
     */
    private List<Integer> extractDaysOfWeek(String norm) {
        List<Integer> days = new ArrayList<>();
        if (containsAny(norm, "thu 2", "thu hai", "t2", "monday"))   addIfAbsent(days, 1);
        if (containsAny(norm, "thu 3", "thu ba",  "t3", "tuesday"))  addIfAbsent(days, 2);
        if (containsAny(norm, "thu 4", "thu tu",  "t4", "wednesday")) addIfAbsent(days, 3);
        if (containsAny(norm, "thu 5", "thu nam", "t5", "thursday"))  addIfAbsent(days, 4);
        if (containsAny(norm, "thu 6", "thu sau", "t6", "friday"))    addIfAbsent(days, 5);
        if (containsAny(norm, "thu 7", "thu bay", "t7", "saturday"))  addIfAbsent(days, 6);
        if (containsAny(norm, "chu nhat", "cn", "sunday"))             addIfAbsent(days, 7);
        return days;
    }

    private boolean containsAny(String norm, String... candidates) {
        for (String c : candidates) {
            if (norm.contains(c)) return true;
        }
        return false;
    }

    private void addIfAbsent(List<Integer> list, int value) {
        if (!list.contains(value)) list.add(value);
    }
}
