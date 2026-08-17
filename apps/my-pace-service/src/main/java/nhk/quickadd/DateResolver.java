package nhk.quickadd;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Deterministic parser for Vietnamese/English relative date expressions.
 * Resolves raw strings into LocalDate using a known reference time.
 * No AI — pure calendar arithmetic.
 *
 * Examples:
 *   "hôm nay"               → today
 *   "mai", "ngày mai"       → today + 1
 *   "ngày mốt", "ngày kia"  → today + 2
 *   "3 ngày nữa"            → today + 3
 *   "sau 5 ngày"            → today + 5
 *   "thứ 6"                 → this Friday (if not passed) or today (if today is Friday)
 *   "thứ 4 tuần sau"        → Wednesday of next week
 *   "cuối tuần"             → next Saturday
 *   "cuối tuần sau"         → Saturday of next week
 *   "ngày 15/8"             → Aug 15 of current year
 *   "20 tháng 10"           → Oct 20 of current year
 */
class DateResolver {

    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    private static final String[] TODAY_CANDIDATES = {
        "hom nay", "today", "toi nay", "sang nay", "chieu nay", "trua nay", "dem nay",
        "tonight", "this evening", "this morning", "this afternoon"
    };
    private static final String[] TOMORROW_CANDIDATES = {
        "mai", "ngay mai", "tomorrow", "toi mai", "sang mai", "chieu mai", "trua mai", "dem mai",
        "tomorrow night", "tomorrow morning", "tomorrow afternoon"
    };
    private static final String[] DAY_AFTER_TOMORROW_CANDIDATES = {
        "ngay kia", "ngay mot", "hom mot", "bua kia", "bua mot", "ngay moc",
        "day after tomorrow"
    };

    // Matches: "3 ngay nua", "2 hom nua", "sau 3 ngay", "3 ngay toi"
    private static final Pattern RELATIVE_DAYS_PATTERN = Pattern.compile(
            "(?:sau\\s*)?(\\d+)\\s*(?:ngay|hom|days?)(?:\\s*nua|\\s*toi)?",
            Pattern.CASE_INSENSITIVE
    );

    // Matches: "2 tuan nua", "sau 2 tuan", "2 tuan toi"
    private static final Pattern RELATIVE_WEEKS_PATTERN = Pattern.compile(
            "(?:sau\\s*)?(\\d+)\\s*(?:tuan|weeks?)(?:\\s*nua|\\s*toi)?",
            Pattern.CASE_INSENSITIVE
    );

    // Matches: "ngay 15/8", "15/08", "15-8", "15/8/2026", "ngay 15-08-2026"
    private static final Pattern DATE_SLASH_PATTERN = Pattern.compile(
            "(?:ngay\\s*)?(\\d{1,2})[/-](\\d{1,2})(?:[/-](\\d{2,4}))?",
            Pattern.CASE_INSENSITIVE
    );

    // Matches: "ngay 20 thang 10", "20 thang 10", "20 thang 10 nam 2026"
    private static final Pattern DATE_TEXT_PATTERN = Pattern.compile(
            "(?:ngay\\s*)?(\\d{1,2})\\s*thang\\s*(\\d{1,2})(?:\\s*nam\\s*(\\d{2,4}))?",
            Pattern.CASE_INSENSITIVE
    );

    LocalDate resolve(String expression, ZonedDateTime now) {
        if (expression == null || expression.isBlank()) return null;

        LocalDate today = now.toLocalDate();
        String normalized = VietnameseTextNormalizer.normalize(expression);
        String norm = normalizeVietnamese(normalized.trim().toLowerCase()).replaceAll("\\s+", " ");

        // 1. Relative day keywords
        if (matchesAny(norm, TODAY_CANDIDATES)) return today;
        if (matchesAny(norm, TOMORROW_CANDIDATES)) return today.plusDays(1);
        if (matchesAny(norm, DAY_AFTER_TOMORROW_CANDIDATES) || matches(norm, "mot")) return today.plusDays(2);

        // 2. Relative offsets: "3 ngay nua", "sau 5 ngay", "2 tuan nua"
        if (norm.contains("nua") || norm.contains("sau ") || norm.startsWith("sau")) {
            Matcher daysMatcher = RELATIVE_DAYS_PATTERN.matcher(norm);
            if (daysMatcher.find()) {
                int days = Integer.parseInt(daysMatcher.group(1));
                return today.plusDays(days);
            }
            // Check for specific weekday in 2+ weeks (e.g. "thứ 2 sau 2 tuần", "t3 2 tuần nữa")
            Matcher weeksMatcher = RELATIVE_WEEKS_PATTERN.matcher(norm);
            if (weeksMatcher.find()) {
                int weeks = Integer.parseInt(weeksMatcher.group(1));
                DayOfWeek dow = parseDayOfWeek(norm);
                if (dow != null) {
                    return today.plusWeeks(weeks).with(dow);
                }
                return today.plusWeeks(weeks);
            }
        }

        // 3. Next next week: "tuan sau nua" (e.g. "thu 2 tuan sau nua", "cuoi tuan sau nua")
        if (norm.contains("tuan sau nua") || norm.contains("tuan toi nua")) {
            DayOfWeek dow = parseDayOfWeek(norm);
            if (dow != null) {
                return today.plusWeeks(2).with(dow);
            }
            if (norm.contains("cuoi tuan")) return today.plusWeeks(2).with(DayOfWeek.SATURDAY);
            if (norm.contains("dau tuan")) return today.plusWeeks(2).with(DayOfWeek.MONDAY);
            return today.plusWeeks(2);
        }

        // 4. Next week specific weekdays ("thu 2 tuan sau", "t3 tuan toi", "thu sau tuan sau")
        boolean isNextWeek = norm.contains("tuan sau") || norm.contains("tuan toi") || norm.contains("next week");
        if (isNextWeek) {
            DayOfWeek dow = parseDayOfWeek(norm);
            if (dow != null) {
                return today.plusWeeks(1).with(dow);
            }
            if (norm.contains("cuoi tuan")) return today.plusWeeks(1).with(DayOfWeek.SATURDAY);
            if (norm.contains("dau tuan")) return today.plusWeeks(1).with(DayOfWeek.MONDAY);
            return today.plusWeeks(1);
        }

        // 5. This week specific weekdays ("thu 6 tuan nay", "t2 tuan nay")
        boolean isThisWeek = norm.contains("tuan nay") || norm.contains("this week");
        if (isThisWeek) {
            DayOfWeek dow = parseDayOfWeek(norm);
            if (dow != null) {
                return today.with(dow);
            }
        }

        // 6. Days of week without explicit week indicator
        DayOfWeek dow = parseDayOfWeek(norm);
        if (dow != null) {
            return resolveWeekday(today, dow);
        }

        // 7. Week / month boundaries
        if (matchesAny(norm, "cuoi tuan", "weekend", "cuoi tuan nay")) {
            if (today.getDayOfWeek() == DayOfWeek.SATURDAY || today.getDayOfWeek() == DayOfWeek.SUNDAY) {
                return today;
            }
            return today.with(DayOfWeek.SATURDAY);
        }
        if (matchesAny(norm, "dau tuan", "dau tuan nay")) return resolveWeekday(today, DayOfWeek.MONDAY);
        if (matchesAny(norm, "cuoi thang", "cuoi thang nay")) return today.with(TemporalAdjusters.lastDayOfMonth());
        if (matchesAny(norm, "dau thang sau", "dau thang toi")) return today.plusMonths(1).with(TemporalAdjusters.firstDayOfMonth());
        if (matchesAny(norm, "thang sau", "thang toi")) return today.plusMonths(1);

        // 7. Explicit date format: "ngay 20 thang 10" or "20 thang 10"
        Matcher dateTextMatcher = DATE_TEXT_PATTERN.matcher(norm);
        if (dateTextMatcher.find()) {
            int day = Integer.parseInt(dateTextMatcher.group(1));
            int month = Integer.parseInt(dateTextMatcher.group(2));
            int year = dateTextMatcher.group(3) != null ? parseYear(dateTextMatcher.group(3), today.getYear()) : today.getYear();
            return safeDate(year, month, day);
        }

        // 8. Explicit date format: "ngay 15/8", "15/08", "15-8-2026"
        Matcher dateSlashMatcher = DATE_SLASH_PATTERN.matcher(norm);
        if (dateSlashMatcher.find()) {
            int day = Integer.parseInt(dateSlashMatcher.group(1));
            int month = Integer.parseInt(dateSlashMatcher.group(2));
            int year = dateSlashMatcher.group(3) != null ? parseYear(dateSlashMatcher.group(3), today.getYear()) : today.getYear();
            return safeDate(year, month, day);
        }

        // 9. ISO date fallback: YYYY-MM-DD
        return tryParseIso(expression.trim());
    }

    private DayOfWeek parseDayOfWeek(String norm) {
        if (matchesAny(norm, "thu 2", "thu hai", "monday", "t2")) return DayOfWeek.MONDAY;
        if (matchesAny(norm, "thu 3", "thu ba", "tuesday", "t3")) return DayOfWeek.TUESDAY;
        if (matchesAny(norm, "thu 4", "thu tu", "wednesday", "t4")) return DayOfWeek.WEDNESDAY;
        if (matchesAny(norm, "thu 5", "thu nam", "thursday", "t5")) return DayOfWeek.THURSDAY;
        if (matchesAny(norm, "thu 6", "thu sau", "friday", "t6")) return DayOfWeek.FRIDAY;
        if (matchesAny(norm, "thu 7", "thu bay", "saturday", "t7")) return DayOfWeek.SATURDAY;
        if (matchesAny(norm, "chu nhat", "cn", "sunday")) return DayOfWeek.SUNDAY;
        return null;
    }

    private LocalDate safeDate(int year, int month, int day) {
        try {
            return LocalDate.of(year, month, day);
        } catch (Exception e) {
            return null;
        }
    }

    private int parseYear(String yearStr, int currentYear) {
        if (yearStr == null || yearStr.isBlank()) return currentYear;
        int y = Integer.parseInt(yearStr);
        if (y < 100) y += 2000;
        return y;
    }

    /**
     * Resolves weekday:
     * - If today IS that day → return today
     * - If target is later in the current week → return this week's occurrence
     * - If target already passed this week → return next week's occurrence
     */
    private LocalDate resolveWeekday(LocalDate today, DayOfWeek target) {
        if (today.getDayOfWeek() == target) {
            return today;
        }
        if (today.getDayOfWeek().getValue() < target.getValue()) {
            return today.with(target);
        }
        return today.with(TemporalAdjusters.next(target));
    }

    private boolean matches(String normalized, String... candidates) {
        for (String c : candidates) {
            if (normalized.equals(c)) return true;
        }
        return false;
    }

    private boolean matchesAny(String normalized, String... candidates) {
        for (String c : candidates) {
            if (normalized.equals(c) || normalized.contains(c)) return true;
        }
        return false;
    }

    private LocalDate tryParseIso(String expression) {
        try {
            return LocalDate.parse(expression.substring(0, 10), ISO_DATE);
        } catch (Exception e) {
            return null;
        }
    }

    static String normalizeVietnamese(String s) {
        if (s == null) return "";
        String noTones = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{Mn}", "");
        return noTones.replace("đ", "d").replace("Đ", "D");
    }
}
