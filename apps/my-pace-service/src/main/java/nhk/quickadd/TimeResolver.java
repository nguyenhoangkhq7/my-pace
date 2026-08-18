package nhk.quickadd;

import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Deterministic parser for Vietnamese/English time expressions.
 * Converts raw strings into LocalTime.
 *
 * Period resolution:
 *   "sáng"          → 08:00 default
 *   "trưa"          → 12:00
 *   "chiều"         → 14:00 default
 *   "tối"           → 19:00 default
 *   "đầu giờ sáng"  → 08:00
 *   "đầu giờ chiều" → 13:30
 *   "cuối giờ chiều"→ 17:00
 *   "cuối ngày"     → 23:59
 *   "8 rưỡi sáng"   → 08:30
 *   "7 rưỡi tối"    → 19:30
 *   "8h kém 15"     → 07:45
 */
class TimeResolver {

    public record TimeRange(LocalTime startTime, LocalTime endTime, Integer durationMinutes) {}

    // Matches: "9-11 giờ tối", "9 - 11h", "9h30 - 11h tối", "14:00 - 16:30", "9-11 gio toi", "6am - 7am", "22h - 6h", "22h đến 6h", "9h sáng đến 11h", "10h sáng - 2h chiều"
    private static final Pattern RANGE_PATTERN = Pattern.compile(
            "(\\d{1,2})(?:[h:](\\d{2}))?\\s*(?:[h:]|gio|g)?\\s*(sang|chieu|toi|trua|dem|am|pm)?\\s*(?:[-–—]|den|đến|toi|tới)\\s*(\\d{1,2})(?:[h:](\\d{2}))?\\s*(?:[h:]|gio|g)?\\s*(sang|chieu|toi|trua|dem|am|pm)?",
            Pattern.CASE_INSENSITIVE
    );

    // Matches: "8 ruoi", "8h ruoi", "8 gio ruoi", "8g ruoi", "8 ruoi sang", "7 ruoi toi"
    private static final Pattern RUOI_TIME_PATTERN = Pattern.compile(
            "(\\d{1,2})\\s*(?:[h:g]|gio)?\\s*ruoi(?:\\s*(sang|chieu|toi|trua|dem|am|pm))?",
            Pattern.CASE_INSENSITIVE
    );

    // Matches: "8h kem 15", "8 gio kem 15", "8g kem 20"
    private static final Pattern KEM_TIME_PATTERN = Pattern.compile(
            "(\\d{1,2})\\s*(?:[h:g]|gio)?\\s*kem\\s*(\\d{1,2})(?:\\s*(sang|chieu|toi|trua|dem|am|pm))?",
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

    // Matches relative offsets requiring prefix "sau" / "in" / "after": "sau 15 phut", "sau 1h", "in 30 mins"
    private static final Pattern RELATIVE_OFFSET_PREFIX_PATTERN = Pattern.compile(
            "\\b(?:sau|after|in)\\s+(\\d+(?:\\.\\d+)?)\\s*(phut|ph|p|min|mins|tieng|gio|g|h)\\b",
            Pattern.CASE_INSENSITIVE
    );

    // Matches relative offsets requiring suffix "nua" / "later": "15 phut nua", "2 tieng nua", "30 mins later"
    private static final Pattern RELATIVE_OFFSET_SUFFIX_PATTERN = Pattern.compile(
            "\\b(\\d+(?:\\.\\d+)?)\\s*(phut|ph|p|min|mins|tieng|gio|g|h)\\s*(?:nua|later|from\\s+now)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern BARE_HOUR_PATTERN = Pattern.compile(
            "\\b(\\d{1,2})\\b"
    );

    public TimeRange resolveRange(String expression, String contextExpression) {
        return resolveRange(expression, contextExpression, null);
    }

    public TimeRange resolveRange(String expression, String contextExpression, ZonedDateTime now) {
        if ((expression == null || expression.isBlank()) && (contextExpression == null || contextExpression.isBlank())) {
            return null;
        }

        String normExpr = VietnameseTextNormalizer.normalize(expression);
        String normCtx = VietnameseTextNormalizer.normalize(contextExpression);

        String mainText = normExpr != null ? normExpr.trim() : "";
        String contextText = normCtx != null ? normCtx.trim() : "";
        String combined = (mainText + " " + contextText).trim();

        if (combined.isBlank()) return null;

        String normMain = DateResolver.normalizeVietnamese(mainText.toLowerCase());
        String normCombined = DateResolver.normalizeVietnamese(combined.toLowerCase());

        String extractedPeriod = extractPeriod(normCombined);

        Matcher rangeMatcher = RANGE_PATTERN.matcher(normMain);
        if (rangeMatcher.find() && rangeMatcher.group(1) != null && rangeMatcher.group(4) != null) {
            int startH = Integer.parseInt(rangeMatcher.group(1));
            int startM = rangeMatcher.group(2) != null ? Integer.parseInt(rangeMatcher.group(2)) : 0;
            String startPeriod = rangeMatcher.group(3) != null ? rangeMatcher.group(3).toLowerCase() : null;

            int endH = Integer.parseInt(rangeMatcher.group(4));
            int endM = rangeMatcher.group(5) != null ? Integer.parseInt(rangeMatcher.group(5)) : 0;
            String endPeriod = rangeMatcher.group(6) != null ? rangeMatcher.group(6).toLowerCase() : null;

            if (startPeriod == null && endPeriod != null) {
                startPeriod = endPeriod;
            }
            if (endPeriod == null && startPeriod != null) {
                endPeriod = startPeriod;
            }
            if (startPeriod == null && extractedPeriod != null) {
                startPeriod = extractedPeriod;
                endPeriod = extractedPeriod;
            }

            if (startPeriod != null) {
                startH = applyPeriod(startH, startPeriod);
            } else {
                startH = applyAmbiguousHeuristic(startH);
            }

            if (endPeriod != null) {
                endH = applyPeriod(endH, endPeriod);
            } else {
                endH = applyAmbiguousHeuristic(endH);
            }

            LocalTime start = safeTime(startH, startM);
            LocalTime end = safeTime(endH, endM);

            if (start != null && end != null) {
                long duration;
                if (end.isBefore(start) || end.equals(start)) {
                    // Cross-midnight range (e.g. 22:00 -> 06:00 is 8 hours = 480 minutes)
                    duration = (24L * 60 - (start.getHour() * 60 + start.getMinute())) + (end.getHour() * 60 + end.getMinute());
                } else {
                    duration = java.time.Duration.between(start, end).toMinutes();
                }

                if (duration <= 0) {
                    duration = 60;
                    end = start.plusMinutes(60);
                }
                return new TimeRange(start, end, (int) duration);
            }
        }

        LocalTime singleStart = resolve(expression, contextExpression, now);
        if (singleStart == null) return null;
        return new TimeRange(singleStart, null, null);
    }

    LocalTime resolve(String expression) {
        return resolve(expression, null, null);
    }

    LocalTime resolve(String expression, String contextExpression) {
        return resolve(expression, contextExpression, null);
    }

    LocalTime resolve(String expression, String contextExpression, ZonedDateTime now) {
        if ((expression == null || expression.isBlank()) && (contextExpression == null || contextExpression.isBlank())) {
            return null;
        }

        String normExpr = VietnameseTextNormalizer.normalize(expression);
        String normCtx = VietnameseTextNormalizer.normalize(contextExpression);

        String mainText = normExpr != null ? normExpr.trim() : "";
        String contextText = normCtx != null ? normCtx.trim() : "";
        String combined = (mainText + " " + contextText).trim();

        if (combined.isBlank()) return null;

        String normMain = DateResolver.normalizeVietnamese(mainText.toLowerCase());
        String normCombined = DateResolver.normalizeVietnamese(combined.toLowerCase());

        // 1. Relative time offset from now (MUST require "sau ..." or "... nữa/tới/later")
        if (now != null) {
            LocalTime relativeTime = resolveRelativeOffset(normMain, now);
            if (relativeTime != null) return relativeTime;
        }

        // 2. Period-only shorthand ("sang", "chieu", "toi", "trua", "dem", "dau gio chieu", "cuoi ngay")
        if (!normMain.isBlank()) {
            LocalTime periodOnly = resolvePeriodOnly(normMain);
            if (periodOnly != null) return periodOnly;
        }

        // Extract period keyword if present in main text or context
        String extractedPeriod = extractPeriod(normCombined);

        // 3. Pattern "X ruoi" ("8 ruoi", "8 ruoi sang", "7 ruoi toi")
        if (!normMain.isBlank()) {
            Matcher ruoiMatcher = RUOI_TIME_PATTERN.matcher(normMain);
            if (ruoiMatcher.find() && ruoiMatcher.group(1) != null) {
                int hour = Integer.parseInt(ruoiMatcher.group(1));
                String period = ruoiMatcher.group(2) != null ? ruoiMatcher.group(2).toLowerCase() : extractedPeriod;
                hour = period != null ? applyPeriod(hour, period) : applyAmbiguousHeuristic(hour);
                return safeTime(hour, 30);
            }
        }

        // 4. Pattern "X kem Y" ("8h kem 15", "8 gio kem 15")
        if (!normMain.isBlank()) {
            Matcher kemMatcher = KEM_TIME_PATTERN.matcher(normMain);
            if (kemMatcher.find() && kemMatcher.group(1) != null && kemMatcher.group(2) != null) {
                int hour = Integer.parseInt(kemMatcher.group(1));
                int kemMins = Integer.parseInt(kemMatcher.group(2));
                String period = kemMatcher.group(3) != null ? kemMatcher.group(3).toLowerCase() : extractedPeriod;

                hour = period != null ? applyPeriod(hour, period) : applyAmbiguousHeuristic(hour);
                hour = (hour == 0) ? 23 : hour - 1;
                int minute = Math.max(0, 60 - kemMins);
                return safeTime(hour, minute);
            }
        }

        // 5. Pattern: "8 gio toi", "3 gio chieu", "3pm"
        if (!normMain.isBlank()) {
            Matcher hourPeriod = HOUR_PERIOD_PATTERN.matcher(normMain);
            if (hourPeriod.find() && hourPeriod.group(1) != null) {
                int hour = Integer.parseInt(hourPeriod.group(1));
                String period = hourPeriod.group(2) != null ? hourPeriod.group(2).toLowerCase() : null;
                if (period != null) {
                    hour = applyPeriod(hour, period);
                }
                return safeTime(hour, 0);
            }
        }

        // 6. Pattern: Standard / Flexible time pattern: "3h", "15:30", "3h30", "8 giờ", "8g", "3pm"
        if (!normMain.isBlank()) {
            Matcher timeMatcher = TIME_PATTERN.matcher(normMain);
            if (timeMatcher.find() && timeMatcher.group(1) != null) {
                int hour = Integer.parseInt(timeMatcher.group(1));
                int minute = timeMatcher.group(2) != null ? Integer.parseInt(timeMatcher.group(2)) : 0;
                String trailingPeriod = timeMatcher.group(3);
                String period = trailingPeriod != null ? trailingPeriod.toLowerCase() : extractedPeriod;

                hour = period != null ? applyPeriod(hour, period) : applyAmbiguousHeuristic(hour);
                return safeTime(hour, minute);
            }
        }

        // 7. Fallback: If timeExpression only has bare hour (e.g. "8") and extractedPeriod is present
        if (!normMain.isBlank() && extractedPeriod != null) {
            Matcher bareMatcher = BARE_HOUR_PATTERN.matcher(normMain);
            if (bareMatcher.find() && bareMatcher.group(1) != null) {
                int hour = Integer.parseInt(bareMatcher.group(1));
                hour = applyPeriod(hour, extractedPeriod);
                return safeTime(hour, 0);
            }
        }

        // 8. Fallback: If timeExpression is blank, but context has period (e.g. "tomorrow afternoon", "chiều mai", "tối nay")
        if (normMain.isBlank() && extractedPeriod != null) {
            return resolvePeriodOnly(extractedPeriod);
        }

        return null;
    }

    private LocalTime resolveRelativeOffset(String normMain, ZonedDateTime now) {
        if (normMain.contains("lat nua") || normMain.contains("ti nua") || normMain.contains("chut nua")) {
            return now.plusMinutes(30).toLocalTime().withSecond(0).withNano(0);
        }

        Matcher matcher = RELATIVE_OFFSET_PREFIX_PATTERN.matcher(normMain);
        if (!matcher.find() || matcher.group(1) == null || matcher.group(2) == null) {
            matcher = RELATIVE_OFFSET_SUFFIX_PATTERN.matcher(normMain);
            if (!matcher.find() || matcher.group(1) == null || matcher.group(2) == null) {
                return null;
            }
        }

        double amount = Double.parseDouble(matcher.group(1));
        String unit = matcher.group(2).toLowerCase();
        int minutes;
        if (unit.startsWith("tieng") || unit.startsWith("gio") || unit.equals("g") || unit.equals("h")) {
            minutes = (int) Math.round(amount * 60);
        } else {
            minutes = (int) Math.round(amount);
        }
        if (minutes > 0) {
            return now.plusMinutes(minutes).toLocalTime().withSecond(0).withNano(0);
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
        if (normText.matches(".*\\b(sang|morning|am)\\b.*")) return "sang";
        if (normText.matches(".*\\b(chieu|afternoon|pm|xe\\s+chieu)\\b.*")) return "chieu";
        if (normText.matches(".*\\b(toi|evening|tonight)\\b.*")) return "toi";
        if (normText.matches(".*\\b(dem|night|midnight)\\b.*")) return "dem";
        if (normText.matches(".*\\b(trua|noon|midday)\\b.*")) return "trua";
        return null;
    }

    private LocalTime resolvePeriodOnly(String normExpr) {
        if (normExpr == null || normExpr.isBlank()) return null;
        if (normExpr.matches(".*\\d.*")) return null;

        if (normExpr.contains("dau gio sang") || normExpr.contains("early morning")) return LocalTime.of(8, 0);
        if (normExpr.contains("dau gio chieu") || normExpr.contains("early afternoon")) return LocalTime.of(13, 30);
        if (normExpr.contains("cuoi gio chieu") || normExpr.contains("late afternoon")) return LocalTime.of(17, 0);
        if (normExpr.contains("giua trua") || normExpr.contains("midday") || normExpr.contains("noon")) return LocalTime.of(12, 0);
        if (normExpr.contains("cuoi ngay") || normExpr.contains("het ngay") || normExpr.contains("end of day")) return LocalTime.of(23, 59);

        String period = extractPeriod(normExpr);
        if (period != null) {
            return switch (period) {
                case "sang" -> LocalTime.of(8, 0);
                case "trua" -> LocalTime.of(12, 0);
                case "chieu" -> LocalTime.of(14, 0);
                case "toi" -> LocalTime.of(19, 0);
                case "dem" -> LocalTime.of(21, 0);
                default -> null;
            };
        }
        return null;
    }

    /**
     * Applies period (sáng/chiều/tối/trưa/am/pm) to disambiguate 12h vs 24h.
     * "3 giờ chiều", "3pm" → hour=3, period=chiều/pm → 15
     */
    private int applyPeriod(int hour, String normPeriod) {
        return switch (normPeriod) {
            case "sang", "am" -> (hour == 12) ? 0 : hour;
            case "trua" -> hour;
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
