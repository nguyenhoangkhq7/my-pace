package nhk.quickadd;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Deterministic resolver for Vietnamese/English recurrence expressions.
 * Converts raw strings into RecurrenceResult (type + days + endDate).
 * No AI — pure keyword & pattern matching.
 *
 * Examples:
 *   "hàng ngày"                      → DAILY
 *   "mỗi 2 4 6"                      → WEEKLY, [1, 3, 5]
 *   "mỗi tối thứ 3"                  → WEEKLY, [2]
 *   "thứ 2 đến thứ 6 hàng tuần"     → WEEKLY, [1, 2, 3, 4, 5]
 *   "mỗi cuối tuần"                  → WEEKLY, [6, 7]
 *   "hàng tuần"  + eventDate=Mon     → WEEKLY, [1]
 *   "mỗi ngày đến hết tháng"         → DAILY, endDate = end of month
 *   null                             → NONE
 */
class RecurrenceResolver {

    private static final Pattern RANGE_PATTERN = Pattern.compile(
            "(?:tu\\s+)?(?:thu\\s*|t)?([2-7])\\s*(?:den|toi|to|-)\\s*(?:thu\\s*|t)?([2-7])",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern RANGE_TO_SUNDAY_PATTERN = Pattern.compile(
            "(?:tu\\s+)?(?:thu\\s*|t)?([2-7])\\s*(?:den|toi|to|-)\\s*(?:chu nhat|cn|sunday)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern NUMBER_SEQUENCE_PATTERN = Pattern.compile(
            "\\b(?:moi|hang tuan|thu|t)?\\s*([2-7](?:[\\s,;+-]+[2-7])+)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern SINGLE_DIGIT_REC_PATTERN = Pattern.compile(
            "\\b(?:moi|hang tuan)\\s+([2-7])\\b",
            Pattern.CASE_INSENSITIVE
    );

    RecurrenceResult resolve(String expression, LocalDate eventDate) {
        if (expression == null || expression.isBlank()) return RecurrenceResult.none();

        String norm = DateResolver.normalizeVietnamese(expression.toLowerCase());
        LocalDate endDate = extractEndDate(norm, eventDate);

        // DAILY
        if (containsAny(norm, "hang ngay", "moi ngay", "daily", "every day")) {
            return new RecurrenceResult("DAILY", null, endDate);
        }

        // MONTHLY
        if (containsAny(norm, "hang thang", "moi thang", "monthly", "every month")) {
            return new RecurrenceResult("MONTHLY", null, endDate);
        }

        // WEEKLY — extract days of week
        List<Integer> days = extractDaysOfWeek(norm);
        if (!days.isEmpty()) {
            return new RecurrenceResult("WEEKLY", days, endDate);
        }

        // WEEKLY — generic marker with fallback to eventDate day
        if (containsAny(norm, "hang tuan", "moi tuan", "weekly", "every week")) {
            if (eventDate != null) {
                days = List.of(eventDate.getDayOfWeek().getValue());
            }
            return new RecurrenceResult("WEEKLY", days.isEmpty() ? null : days, endDate);
        }

        return RecurrenceResult.none();
    }

    /**
     * Extracts day-of-week numbers (1=Mon…7=Sun) from a normalized expression.
     * Preserves natural day order, removes duplicates.
     */
    private List<Integer> extractDaysOfWeek(String norm) {
        List<Integer> days = new ArrayList<>();

        // 1. Day Range: "thứ 2 đến thứ 6", "từ 2 đến 6", "t2 đến t6", "2 - 6"
        Matcher rangeMatcher = RANGE_PATTERN.matcher(norm);
        if (rangeMatcher.find() && rangeMatcher.group(1) != null && rangeMatcher.group(2) != null) {
            int startD = Integer.parseInt(rangeMatcher.group(1)); // 2..7 -> Mon..Sat (1..6)
            int endD = Integer.parseInt(rangeMatcher.group(2));
            int startDayVal = startD - 1;
            int endDayVal = endD - 1;
            if (startDayVal <= endDayVal) {
                for (int d = startDayVal; d <= endDayVal; d++) {
                    addIfAbsent(days, d);
                }
                return days;
            }
        }

        Matcher rangeSundayMatcher = RANGE_TO_SUNDAY_PATTERN.matcher(norm);
        if (rangeSundayMatcher.find() && rangeSundayMatcher.group(1) != null) {
            int startD = Integer.parseInt(rangeSundayMatcher.group(1));
            int startDayVal = startD - 1;
            for (int d = startDayVal; d <= 7; d++) {
                addIfAbsent(days, d);
            }
            return days;
        }

        // 2. Weekend keywords: "cuối tuần", "weekend"
        if (containsAny(norm, "cuoi tuan", "weekend")) {
            addIfAbsent(days, 6);
            addIfAbsent(days, 7);
            return days;
        }

        // 3. Weekday keywords: "ngày trong tuần", "các ngày trong tuần", "ngày thường", "weekdays"
        if (containsAny(norm, "cac ngay trong tuan", "ngay trong tuan", "ngay thuong", "weekdays")) {
            for (int d = 1; d <= 5; d++) addIfAbsent(days, d);
            return days;
        }

        // 4. Number Sequences (e.g. "2 4 6", "3 5 7", "2, 4, 6", "2-4-6", "2 3 4 5 6", "t2 t4 t6")
        Matcher seqMatcher = NUMBER_SEQUENCE_PATTERN.matcher(norm);
        if (seqMatcher.find() && seqMatcher.group(1) != null) {
            String seq = seqMatcher.group(1);
            String[] digits = seq.split("[\\s,;+-]+");
            if (digits.length >= 2) {
                for (String dStr : digits) {
                    try {
                        int d = Integer.parseInt(dStr.trim());
                        if (d >= 2 && d <= 7) {
                            addIfAbsent(days, d - 1); // 2 -> 1 (Mon), 3 -> 2 (Tue), ..., 7 -> 6 (Sat)
                        } else if (d == 8) {
                            addIfAbsent(days, 7); // 8 -> 7 (Sun)
                        }
                    } catch (NumberFormatException ignored) {}
                }
                if (containsAny(norm, "chu nhat", "cn", "sunday")) {
                    addIfAbsent(days, 7);
                }
                if (!days.isEmpty()) return days;
            }
        }

        // 5. Explicit Individual Tokens
        if (containsWordOrPhrase(norm, "thu 2", "thu hai", "t2", "monday"))   addIfAbsent(days, 1);
        if (containsWordOrPhrase(norm, "thu 3", "thu ba",  "t3", "tuesday"))  addIfAbsent(days, 2);
        if (containsWordOrPhrase(norm, "thu 4", "thu tu",  "t4", "wednesday")) addIfAbsent(days, 3);
        if (containsWordOrPhrase(norm, "thu 5", "thu nam", "t5", "thursday"))  addIfAbsent(days, 4);
        if (containsWordOrPhrase(norm, "thu 6", "thu sau", "t6", "friday"))    addIfAbsent(days, 5);
        if (containsWordOrPhrase(norm, "thu 7", "thu bay", "t7", "saturday"))  addIfAbsent(days, 6);
        if (containsWordOrPhrase(norm, "chu nhat", "cn", "sunday"))             addIfAbsent(days, 7);

        // 6. Single digit after "mỗi" (e.g. "mỗi 3", "mỗi 2")
        if (days.isEmpty()) {
            Matcher singleMatcher = SINGLE_DIGIT_REC_PATTERN.matcher(norm);
            if (singleMatcher.find() && singleMatcher.group(1) != null) {
                int d = Integer.parseInt(singleMatcher.group(1));
                if (d >= 2 && d <= 7) addIfAbsent(days, d - 1);
                else if (d == 8) addIfAbsent(days, 7);
            }
        }

        return days;
    }

    private LocalDate extractEndDate(String norm, LocalDate referenceDate) {
        LocalDate base = referenceDate != null ? referenceDate : LocalDate.now();

        if (norm.contains("het thang") || norm.contains("cuoi thang") || norm.contains("end of month")) {
            return base.with(TemporalAdjusters.lastDayOfMonth());
        }
        if (norm.contains("het nam") || norm.contains("cuoi nam") || norm.contains("end of year")) {
            return base.with(TemporalAdjusters.lastDayOfYear());
        }

        Pattern datePattern = Pattern.compile("(?:den|cho den|until)\\s+(?:ngay\\s+)?(\\d{1,2})[/-](\\d{1,2})(?:[/-](\\d{4}))?");
        Matcher m = datePattern.matcher(norm);
        if (m.find() && m.group(1) != null && m.group(2) != null) {
            try {
                int day = Integer.parseInt(m.group(1));
                int month = Integer.parseInt(m.group(2));
                int year = m.group(3) != null ? Integer.parseInt(m.group(3)) : base.getYear();
                return LocalDate.of(year, month, day);
            } catch (Exception ignored) {}
        }

        return null;
    }

    private boolean containsAny(String norm, String... candidates) {
        for (String c : candidates) {
            if (norm.contains(c)) return true;
        }
        return false;
    }

    private boolean containsWordOrPhrase(String norm, String... candidates) {
        for (String c : candidates) {
            if (norm.matches(".*\\b" + Pattern.quote(c) + "\\b.*")) return true;
        }
        return false;
    }

    private void addIfAbsent(List<Integer> list, int value) {
        if (!list.contains(value)) list.add(value);
    }
}
