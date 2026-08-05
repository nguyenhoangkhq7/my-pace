package nhk.quickadd;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;

/**
 * Deterministic parser for Vietnamese/English relative date expressions.
 * Resolves raw strings into LocalDate using a known reference time.
 * No AI — pure calendar arithmetic.
 *
 * Examples:
 *   "hôm nay"      → today
 *   "mai"          → today + 1
 *   "thứ 6"        → next Friday
 *   "cuối tuần"    → next Saturday
 *   "cuối tháng"   → last day of current month
 */
class DateResolver {

    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    LocalDate resolve(String expression, ZonedDateTime now) {
        if (expression == null || expression.isBlank()) return null;

        LocalDate today = now.toLocalDate();
        String norm = normalizeVietnamese(expression.trim().toLowerCase()).replaceAll("\\s+", " ");

        // Relative day keywords
        if (matches(norm, "hom nay", "today")) return today;
        if (matches(norm, "mai", "ngay mai", "tomorrow")) return today.plusDays(1);
        if (matches(norm, "ngay kia", "mot", "ngay moc")) return today.plusDays(2);

        // Days of week — always returns NEXT occurrence (never today)
        if (matchesAny(norm, "thu 2", "thu hai", "monday", "t2")) return nextWeekday(today, DayOfWeek.MONDAY);
        if (matchesAny(norm, "thu 3", "thu ba", "tuesday", "t3")) return nextWeekday(today, DayOfWeek.TUESDAY);
        if (matchesAny(norm, "thu 4", "thu tu", "wednesday", "t4")) return nextWeekday(today, DayOfWeek.WEDNESDAY);
        if (matchesAny(norm, "thu 5", "thu nam", "thursday", "t5")) return nextWeekday(today, DayOfWeek.THURSDAY);
        if (matchesAny(norm, "thu 6", "thu sau", "friday", "t6")) return nextWeekday(today, DayOfWeek.FRIDAY);
        if (matchesAny(norm, "thu 7", "thu bay", "saturday", "t7")) return nextWeekday(today, DayOfWeek.SATURDAY);
        if (matchesAny(norm, "chu nhat", "cn", "sunday")) return nextWeekday(today, DayOfWeek.SUNDAY);

        // Week / month boundaries
        if (matchesAny(norm, "cuoi tuan", "weekend", "cuoi tuan nay")) return nextWeekday(today, DayOfWeek.SATURDAY);
        if (matchesAny(norm, "dau tuan", "dau tuan nay", "dau tuan toi")) return nextWeekday(today, DayOfWeek.MONDAY);
        if (matchesAny(norm, "tuan sau", "tuan toi")) return today.plusWeeks(1);
        if (matchesAny(norm, "cuoi thang", "cuoi thang nay")) return today.with(TemporalAdjusters.lastDayOfMonth());
        if (matchesAny(norm, "dau thang sau", "dau thang toi")) return today.plusMonths(1).with(TemporalAdjusters.firstDayOfMonth());
        if (matchesAny(norm, "thang sau", "thang toi")) return today.plusMonths(1);

        // ISO date fallback: YYYY-MM-DD
        return tryParseIso(expression.trim());
    }

    /** Returns next occurrence of target weekday. If today IS that day → 7 days forward. */
    private LocalDate nextWeekday(LocalDate today, DayOfWeek target) {
        if (today.getDayOfWeek() == target) {
            return today.plusDays(7);
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
        // NFD decomposes precomposed chars (e.g. ờ → o + horn + grave)
        // then \\p{Mn} strips all combining/diacritic marks → leaves ASCII base letters
        String noTones = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{Mn}", "");
        // ơ (U+01A1) and ư (U+01B0) do decompose to o+031B / u+031B in NFD,
        // but đ (U+0111) does NOT decompose — handle it explicitly
        return noTones.replace("đ", "d").replace("Đ", "D");
    }
}
