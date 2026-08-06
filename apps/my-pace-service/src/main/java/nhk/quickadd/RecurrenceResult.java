package nhk.quickadd;

import java.time.LocalDate;
import java.util.List;

/**
 * Resolved recurrence data. Never exposed outside the quickadd package.
 *
 * recurrenceType matches FixedEvent.recurrenceType: "NONE" | "DAILY" | "WEEKLY"
 * recurrenceDays: 1=Mon … 7=Sun (matches FixedEvent.recurrenceRule format)
 */
record RecurrenceResult(
        String recurrenceType,
        List<Integer> recurrenceDays,
        LocalDate recurrenceEndDate
) {
    static RecurrenceResult none() {
        return new RecurrenceResult("NONE", null, null);
    }
}
