package nhk.quickadd;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Deterministic parser for Vietnamese/English duration expressions.
 * Converts raw strings into integer minutes.
 * No AI — pure regex + arithmetic.
 *
 * Examples:
 *   "2 tiếng"               → 120
 *   "30 phút"               → 30
 *   "45p", "45ph"           → 45
 *   "1h30", "1h30p"         → 90
 *   "1.5h", "2,5h"          → 90 / 150
 *   "nửa tiếng"             → 30
 *   "tiếng rưỡi"            → 90
 *   "hai tiếng rưỡi"        → 150
 *   "mười lăm phút"         → 15
 *   "tầm 45 phút"           → 45
 */
class DurationResolver {

    // Matches: "2 tieng ruoi", "2 gio ruoi", "2h ruoi", "2g ruoi"
    private static final Pattern HOUR_RUOI_PATTERN = Pattern.compile(
            "(\\d+(?:\\.\\d+)?)\\s*(?:tieng|gio|g|h(?:r|rs|our|ours)?)\\s*ruoi",
            Pattern.CASE_INSENSITIVE
    );

    // Matches: "2 tieng 30 phut", "2tieng", "2h", "2h30", "2h 30m", "1.5h", "2hr", "2hours"
    private static final Pattern HOUR_MINUTE_PATTERN = Pattern.compile(
            "(\\d+(?:[.,]\\d+)?)\\s*(?:tieng|gio|g|h(?:r|rs|our|ours)?)\\s*(?:(\\d{1,2})\\s*(?:phut|ph|p|m(?:in)?s?|')?)?",
            Pattern.CASE_INSENSITIVE
    );

    // Matches: "30 phut", "45p", "45ph", "45'", "45 min", "45 mins"
    private static final Pattern MINUTE_ONLY_PATTERN = Pattern.compile(
            "(\\d+)\\s*(?:phut|ph|p|m(?:in)?s?|')",
            Pattern.CASE_INSENSITIVE
    );

    Integer resolve(String expression) {
        if (expression == null || expression.isBlank()) return null;

        String normalized = VietnameseTextNormalizer.normalize(expression);
        String norm = DateResolver.normalizeVietnamese(normalized.trim().toLowerCase()).replaceAll("\\s+", " ");

        // 1. Half-hour idioms: "nua tieng", "nua gio", "nua h"
        if (norm.contains("nua tieng") || norm.contains("nua gio") || norm.contains("nua h")) {
            return 30;
        }

        // 2. Standalone "tieng ruoi", "gio ruoi" (without preceding number -> defaults to 1.5 hours = 90 mins)
        if (norm.equals("tieng ruoi") || norm.equals("gio ruoi") ||
            norm.endsWith(" tieng ruoi") || norm.endsWith(" gio ruoi")) {
            Matcher ruoiMatcher = HOUR_RUOI_PATTERN.matcher(norm);
            if (ruoiMatcher.find()) {
                double hours = Double.parseDouble(ruoiMatcher.group(1));
                return (int) Math.round(hours * 60 + 30);
            }
            return 90;
        }

        // 3. "X tieng ruoi", "X gio ruoi", "Xh ruoi" (e.g. "2 tieng ruoi" -> 150)
        Matcher ruoiMatcher = HOUR_RUOI_PATTERN.matcher(norm);
        if (ruoiMatcher.find()) {
            double hours = Double.parseDouble(ruoiMatcher.group(1));
            return (int) Math.round(hours * 60 + 30);
        }

        // 4. Hours + optional minutes: "2 tieng", "1.5h", "1h45", "1h45p", "2 gio 30 phut"
        Matcher hourMatcher = HOUR_MINUTE_PATTERN.matcher(norm);
        if (hourMatcher.find()) {
            double hours = Double.parseDouble(hourMatcher.group(1).replace(',', '.'));
            int total = (int) Math.round(hours * 60);
            if (hourMatcher.group(2) != null && !hourMatcher.group(2).isBlank()) {
                total += Integer.parseInt(hourMatcher.group(2));
            }
            return total > 0 ? total : null;
        }

        // 5. Minutes only: "45 phut", "30p", "45ph", "45'"
        Matcher minuteMatcher = MINUTE_ONLY_PATTERN.matcher(norm);
        if (minuteMatcher.find()) {
            int minutes = Integer.parseInt(minuteMatcher.group(1));
            return minutes > 0 ? minutes : null;
        }

        return null;
    }
}
