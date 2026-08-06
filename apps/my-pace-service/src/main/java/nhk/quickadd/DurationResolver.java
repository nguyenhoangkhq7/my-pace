package nhk.quickadd;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Deterministic parser for Vietnamese/English duration expressions.
 * Converts raw strings into integer minutes.
 * No AI — pure regex + arithmetic.
 *
 * Examples:
 *   "2 tiếng"   → 120
 *   "30 phút"   → 30
 *   "1h30"      → 90
 *   "1.5h"      → 90
 *   "45'"       → 45
 *   "2h"        → 120
 */
class DurationResolver {

    // Matches: "2 tiếng", "2tiếng", "2h", "2h30", "2h 30m", "1.5h", "2hr", "2hours"
    private static final Pattern HOUR_MINUTE_PATTERN = Pattern.compile(
            "(\\d+(?:[.,]\\d+)?)\\s*(?:tiếng|gi[oờ]|h(?:r|rs|our|ours)?)\\s*(?:(\\d{1,2})\\s*(?:phút|m(?:in)?s?|'))?",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Matches: "30 phút", "45'", "45 min"
    private static final Pattern MINUTE_ONLY_PATTERN = Pattern.compile(
            "(\\d+)\\s*(?:phút|m(?:in)?s?|')",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    Integer resolve(String expression) {
        if (expression == null || expression.isBlank()) return null;

        String normalized = expression.trim();

        Matcher hourMatcher = HOUR_MINUTE_PATTERN.matcher(normalized);
        if (hourMatcher.find()) {
            double hours = Double.parseDouble(hourMatcher.group(1).replace(',', '.'));
            int total = (int) Math.round(hours * 60);
            if (hourMatcher.group(2) != null) {
                total += Integer.parseInt(hourMatcher.group(2));
            }
            return total > 0 ? total : null;
        }

        Matcher minuteMatcher = MINUTE_ONLY_PATTERN.matcher(normalized);
        if (minuteMatcher.find()) {
            int minutes = Integer.parseInt(minuteMatcher.group(1));
            return minutes > 0 ? minutes : null;
        }

        return null;
    }
}
