package nhk.quickadd;

import java.time.LocalTime;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Deterministic parser for Vietnamese/English time expressions.
 * Converts raw strings into LocalTime.
 * No AI — pure string matching + arithmetic.
 *
 * Period resolution:
 *   "sáng"  → 08:00 default
 *   "trưa"  → 12:00
 *   "chiều" → 14:00 default
 *   "tối"   → 19:00 default
 *
 * Ambiguous bare hours (no period given):
 *   1–5  → PM (+12h) — 1am/2am/3am meetings extremely rare
 *   6–11 → AM
 *   12+  → as-is
 */
class TimeResolver {

    // Matches: "3h", "3:00", "3h30", "3:30", "03:30", "7h30", "15h", "15:30"
    // Run against normalized (diacritic-stripped) expression
    private static final Pattern TIME_PATTERN = Pattern.compile(
            "(\\d{1,2})[h:](\\d{2})?\\s*(sang|chieu|toi|trua|dem)?",
            Pattern.CASE_INSENSITIVE
    );

    // Matches: "3 gio chieu", "7 gio toi", "8 gio sang" (after normalization)
    private static final Pattern HOUR_PERIOD_PATTERN = Pattern.compile(
            "(\\d{1,2})\\s*gio\\s*(sang|chieu|toi|trua|dem)",
            Pattern.CASE_INSENSITIVE
    );

    LocalTime resolve(String expression) {
        if (expression == null || expression.isBlank()) return null;

        // Normalize once — removes all Vietnamese diacritics for consistent matching
        String norm = DateResolver.normalizeVietnamese(expression.trim().toLowerCase());

        // 1. Period-only shorthand ("sang", "chieu", "toi", "trua")
        LocalTime periodOnly = resolvePeriodOnly(norm);
        if (periodOnly != null) return periodOnly;

        // 2. "X gio chieu" pattern — highest priority for period clarity
        Matcher hourPeriod = HOUR_PERIOD_PATTERN.matcher(norm);
        if (hourPeriod.find()) {
            int hour = Integer.parseInt(hourPeriod.group(1));
            String period = hourPeriod.group(2).toLowerCase();
            hour = applyPeriod(hour, period);
            return safeTime(hour, 0);
        }

        // 3. Standard time pattern: "3h", "15:30", "3h30" (also on normalized string)
        Matcher timeMatcher = TIME_PATTERN.matcher(norm);
        if (timeMatcher.find()) {
            int hour = Integer.parseInt(timeMatcher.group(1));
            int minute = timeMatcher.group(2) != null ? Integer.parseInt(timeMatcher.group(2)) : 0;
            String period = timeMatcher.group(3);
            hour = period != null ? applyPeriod(hour, period) : applyAmbiguousHeuristic(hour);
            return safeTime(hour, minute);
        }

        return null;
    }

    /** Computes endTime = startTime + durationMinutes. Returns null if startTime is null. */
    LocalTime resolveEndTime(LocalTime startTime, Integer durationMinutes) {
        if (startTime == null) return null;
        int duration = (durationMinutes != null && durationMinutes > 0) ? durationMinutes : 60;
        return startTime.plusMinutes(duration);
    }

    private LocalTime resolvePeriodOnly(String normExpr) {
        return switch (normExpr) {
            case "sang" -> LocalTime.of(8, 0);
            case "trua" -> LocalTime.of(12, 0);
            case "chieu" -> LocalTime.of(14, 0);
            case "toi" -> LocalTime.of(19, 0);
            case "dem" -> LocalTime.of(21, 0);
            default -> null;
        };
    }

    /**
     * Applies period (sáng/chiều/tối/trưa) to disambiguate 12h vs 24h.
     * "3 giờ chiều" → hour=3, period=chiều → 15
     */
    private int applyPeriod(int hour, String normPeriod) {
        return switch (normPeriod) {
            case "sang" -> hour; // morning: keep
            case "trua" -> (hour == 12) ? 12 : hour; // noon
            case "chieu", "xe" -> (hour > 0 && hour < 12) ? hour + 12 : hour; // afternoon
            case "toi", "dem" -> (hour > 0 && hour < 12) ? hour + 12 : hour; // evening
            default -> hour;
        };
    }

    /**
     * Heuristic for ambiguous bare hours (e.g. "3h" with no sáng/chiều indicator).
     * Hours 1–5 are almost never used for AM in productivity context → treat as PM.
     * Hours 6–11 are typical morning slots → AM.
     * Hours 12+ → as-is (24h format).
     */
    private int applyAmbiguousHeuristic(int hour) {
        if (hour >= 1 && hour <= 5) return hour + 12;
        return hour;
    }

    private LocalTime safeTime(int hour, int minute) {
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
        return LocalTime.of(hour, minute);
    }
}
