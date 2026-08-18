package nhk.quickadd;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility for normalizing Vietnamese conversational numbers, time units, and idioms
 * into standard digit-based expressions.
 *
 * Examples:
 *   "hai tiếng rưỡi"           → "2.5 tiếng"
 *   "nửa tiếng"                → "30 phút"
 *   "tiếng rưỡi"               → "1.5 tiếng"
 *   "mười lăm phút"            → "15 phút"
 *   "hai mươi phút"            → "20 phút"
 *   "ba mươi phút"             → "30 phút"
 *   "bốn mươi lăm phút"        → "45 phút"
 *   "tám giờ tối"              → "8 giờ tối"
 *   "chín giờ rưỡi sáng"       → "9:30 sáng"
 *   "ngày mười lăm tháng tám"  → "ngày 15 tháng 8"
 */
public final class VietnameseTextNormalizer {

    private VietnameseTextNormalizer() {}

    private static final Pattern NUA_TIENG_PATTERN = Pattern.compile(
            "\\b(?:nua|nửa)\\s*(?:tieng|tiếng|gio|giờ|h|g)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern MOT_TIENG_RUOI_PATTERN = Pattern.compile(
            "\\b(?:1|mot|một)?\\s*(?:tieng|tiếng|gio|giờ|h|g)\\s*(?:ruoi|rưỡi)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern NUM_TIENG_RUOI_PATTERN = Pattern.compile(
            "\\b(\\d+|hai|ba|bon|bốn|nam|năm|sau|sáu|bay|bảy|tam|tám|chin|chín|muoi|mười)\\s*(?:tieng|tiếng|gio|giờ|h|g)\\s*(?:ruoi|rưỡi)\\b",
            Pattern.CASE_INSENSITIVE
    );

    public static String normalize(String text) {
        if (text == null || text.isBlank()) return "";

        String result = text.trim();

        // 1. Common duration idioms
        result = NUA_TIENG_PATTERN.matcher(result).replaceAll("30 phút");

        Matcher numRuoiMatcher = NUM_TIENG_RUOI_PATTERN.matcher(result);
        if (numRuoiMatcher.find()) {
            String numStr = numRuoiMatcher.group(1);
            int num = parseWordOrDigit(numStr);
            if (num > 0) {
                result = result.replace(numRuoiMatcher.group(0), num + ".5 tiếng");
            }
        }

        result = MOT_TIENG_RUOI_PATTERN.matcher(result).replaceAll("1.5 tiếng");

        // 2. Normalize compound number words (10 - 99)
        result = replaceCompoundNumbers(result);

        // 3. Normalize single number words (0 - 9)
        result = replaceSingleNumbers(result);

        return result;
    }

    private static String replaceCompoundNumbers(String text) {
        String res = text;

        // Decades with units (e.g. "hai mươi lăm", "ba mươi phút", "mười lăm phút")
        res = replaceWord(res, "mười lăm|muoi lam|muoi lăm", "15");
        res = replaceWord(res, "mười bốn|muoi bon|mười tư|muoi tu", "14");
        res = replaceWord(res, "mười ba|muoi ba", "13");
        res = replaceWord(res, "mười hai|muoi hai", "12");
        res = replaceWord(res, "mười một|muoi mot", "11");
        res = replaceWord(res, "mười|muoi", "10");

        res = replaceWord(res, "hai mươi lăm|hai muoi lam|hai lăm|hai lam", "25");
        res = replaceWord(res, "hai mươi|hai muoi", "20");
        res = replaceWord(res, "ba mươi lăm|ba muoi lam|ba lăm|ba lam", "35");
        res = replaceWord(res, "ba mươi|ba muoi", "30");
        res = replaceWord(res, "bốn mươi lăm|bon muoi lam|bốn lăm|bon lam|bốn mươi|bon muoi", "45");
        res = replaceWord(res, "bốn mươi|bon muoi", "40");
        res = replaceWord(res, "năm mươi lăm|nam muoi lam|năm lăm|nam lam", "55");
        res = replaceWord(res, "năm mươi|nam muoi", "50");

        return res;
    }

    private static String replaceSingleNumbers(String text) {
        String res = text;
        res = replaceWord(res, "không|khong", "0");
        res = replaceWord(res, "một|mot", "1");
        res = replaceWord(res, "hai", "2");
        res = replaceWord(res, "ba", "3");
        res = replaceWord(res, "bốn|bon", "4");
        res = replaceWord(res, "năm|nam", "5");
        res = replaceWord(res, "sáu|sau", "6");
        res = replaceWord(res, "bảy|bay", "7");
        res = replaceWord(res, "tám|tam", "8");
        res = replaceWord(res, "chín|chin", "9");
        return res;
    }

    private static String replaceWord(String text, String patternStr, String replacement) {
        return text.replaceAll("(?i)\\b(?:" + patternStr + ")\\b", replacement);
    }

    public static int parseWordOrDigit(String str) {
        if (str == null || str.isBlank()) return 0;
        String s = str.trim().toLowerCase();
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException ignored) {}

        return switch (DateResolver.normalizeVietnamese(s)) {
            case "mot" -> 1;
            case "hai" -> 2;
            case "ba" -> 3;
            case "bon", "tu" -> 4;
            case "nam" -> 5;
            case "sau" -> 6;
            case "bay" -> 7;
            case "tam" -> 8;
            case "chin" -> 9;
            case "muoi" -> 10;
            default -> 0;
        };
    }
}
