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

    public record TimeRange(LocalTime startTime, LocalTime endTime, Integer durationMinutes) {}

    // Matches: "9-11 giờ tối", "9 - 11h", "9h30 - 11h tối", "14:00 - 16:30", "9-11 gio toi", "6am - 7am"
    private static final Pattern RANGE_PATTERN = Pattern.compile(
            "(\\d{1,2})(?:[h:](\\d{2}))?\\s*(?:[h:]|gio|g|am|pm)?\\s*[-–—]\\s*(\\d{1,2})(?:[h:](\\d{2}))?\\s*(?:[h:]|gio|g|am|pm)?\\s*(sang|chieu|toi|trua|dem|am|pm)?",
            Pattern.CASE_INSENSITIVE
    );

    // Matches: "3h", "3:00", "3h30", "3:30", "03:30", "7h30", "15h", "15:30", "8 giờ", "8gio", "8g", "3pm", "10am", "3 pm"
    private static final Pattern TIME_PATTERN = Pattern.compile(
            "(\\d{1,2})\\s*(?:[h:]|gio|g)?\\s*(\\d{2})?\\s*(sang|chieu|toi|trua|dem|am|pm)?",
            Pattern.CASE_INSENSITIVE
    );

    // Matches: "3 gio chieu", "7 gio toi", "8 gio sang", "3pm", "10am"
    private static final Pattern HOUR_PERIOD_PATTERN = Pattern.compile(
            "(\\d{1,2})\\s*(?:gio|g|h)?\\s*(sang|chieu|toi|trua|dem|am|pm)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern BARE_HOUR_PATTERN = Pattern.compile(
            "\\b(\\d{1,2})\\b"
    );

    public TimeRange resolveRange(String expression, String contextExpression) {
        if ((expression == null || expression.isBlank()) && (contextExpression == null || contextExpression.isBlank())) {
            return null;
        }

        String mainText = expression != null ? expression.trim() : "";
        String contextText = contextExpression != null ? contextExpression.trim() : "";
        String combined = (mainText + " " + contextText).trim();

        if (combined.isBlank()) return null;

        String normMain = DateResolver.normalizeVietnamese(mainText.toLowerCase());
        String normCombined = DateResolver.normalizeVietnamese(combined.toLowerCase());

        String extractedPeriod = extractPeriod(normCombined);

        Matcher rangeMatcher = RANGE_PATTERN.matcher(normMain);
        if (rangeMatcher.find()) {
            int startH = Integer.parseInt(rangeMatcher.group(1));
            int startM = rangeMatcher.group(2) != null ? Integer.parseInt(rangeMatcher.group(2)) : 0;
            int endH = Integer.parseInt(rangeMatcher.group(3));
            int endM = rangeMatcher.group(4) != null ? Integer.parseInt(rangeMatcher.group(4)) : 0;

            String period = rangeMatcher.group(5) != null ? rangeMatcher.group(5).toLowerCase() : extractedPeriod;

            if (period != null) {
                startH = applyPeriod(startH, period);
                endH = applyPeriod(endH, period);
            } else {
                startH = applyAmbiguousHeuristic(startH);
                endH = applyAmbiguousHeuristic(endH);
            }

            LocalTime start = safeTime(startH, startM);
            LocalTime end = safeTime(endH, endM);

            if (start != null && end != null) {
                long duration = java.time.Duration.between(start, end).toMinutes();
                if (duration <= 0) {
                    duration = 60;
                    end = start.plusMinutes(60);
                }
                return new TimeRange(start, end, (int) duration);
            }
        }

        LocalTime singleStart = resolve(expression, contextExpression);
        if (singleStart == null) return null;
        return new TimeRange(singleStart, null, null);
    }

    LocalTime resolve(String expression) {
        return resolve(expression, null);
    }

    LocalTime resolve(String expression, String contextExpression) {
        if ((expression == null || expression.isBlank()) && (contextExpression == null || contextExpression.isBlank())) {
            return null;
        }

        String mainText = expression != null ? expression.trim() : "";
        String contextText = contextExpression != null ? contextExpression.trim() : "";
        String combined = (mainText + " " + contextText).trim();

        if (combined.isBlank()) return null;

        String normMain = DateResolver.normalizeVietnamese(mainText.toLowerCase());
        String normCombined = DateResolver.normalizeVietnamese(combined.toLowerCase());

        // 1. Period-only shorthand ("sang", "chieu", "toi", "trua", "dem")
        if (!normMain.isBlank()) {
            LocalTime periodOnly = resolvePeriodOnly(normMain);
            if (periodOnly != null) return periodOnly;
        }

        // Extract period keyword if present in main text or context
        String extractedPeriod = extractPeriod(normCombined);

        // 2. Pattern 1: "8 gio toi", "3 gio chieu", "3pm"
        if (!normMain.isBlank()) {
            Matcher hourPeriod = HOUR_PERIOD_PATTERN.matcher(normMain);
            if (hourPeriod.find()) {
                int hour = Integer.parseInt(hourPeriod.group(1));
                String period = hourPeriod.group(2).toLowerCase();
                hour = applyPeriod(hour, period);
                return safeTime(hour, 0);
            }
        }

        // 3. Pattern 2: Standard / Flexible time pattern: "3h", "15:30", "3h30", "8 giờ", "8g", "3pm"
        if (!normMain.isBlank()) {
            Matcher timeMatcher = TIME_PATTERN.matcher(normMain);
            if (timeMatcher.find()) {
                int hour = Integer.parseInt(timeMatcher.group(1));
                int minute = timeMatcher.group(2) != null ? Integer.parseInt(timeMatcher.group(2)) : 0;
                String trailingPeriod = timeMatcher.group(3);
                String period = trailingPeriod != null ? trailingPeriod.toLowerCase() : extractedPeriod;

                hour = period != null ? applyPeriod(hour, period) : applyAmbiguousHeuristic(hour);
                return safeTime(hour, minute);
            }
        }

        // 4. Fallback: If timeExpression only has bare hour (e.g. "8") and extractedPeriod is present
        if (!normMain.isBlank() && extractedPeriod != null) {
            Matcher bareMatcher = BARE_HOUR_PATTERN.matcher(normMain);
            if (bareMatcher.find()) {
                int hour = Integer.parseInt(bareMatcher.group(1));
                hour = applyPeriod(hour, extractedPeriod);
                return safeTime(hour, 0);
            }
        }

        return null;
    }

    /** Computes endTime = startTime + durationMinutes. Returns null if startTime is null. */
    LocalTime resolveEndTime(LocalTime startTime, Integer durationMinutes) {
        if (startTime == null) return null;
        int duration = (durationMinutes != null && durationMinutes > 0) ? durationMinutes : 60;
        return startTime.plusMinutes(duration);
    }

    private String extractPeriod(String normText) {
        if (normText.contains("sang") || normText.matches(".*\\bam\\b.*")) return "sang";
        if (normText.contains("chieu") || normText.contains("xe") || normText.matches(".*\\bpm\\b.*")) return "chieu";
        if (normText.contains("toi")) return "toi";
        if (normText.contains("dem")) return "dem";
        if (normText.contains("trua")) return "trua";
        return null;
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
     * Applies period (sáng/chiều/tối/trưa/am/pm) to disambiguate 12h vs 24h.
     * "3 giờ chiều", "3pm" → hour=3, period=chiều/pm → 15
     */
    private int applyPeriod(int hour, String normPeriod) {
        return switch (normPeriod) {
            case "sang", "am" -> (hour == 12) ? 0 : hour;
            case "trua" -> (hour == 12) ? 12 : hour;
            case "chieu", "xe", "pm" -> (hour > 0 && hour < 12) ? hour + 12 : hour;
            case "toi", "dem" -> (hour > 0 && hour < 12) ? hour + 12 : hour;
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
