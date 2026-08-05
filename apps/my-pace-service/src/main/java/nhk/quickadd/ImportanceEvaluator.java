package nhk.quickadd;

import java.util.List;

/**
 * Determines isImportant from title and categoryHint.
 * No AI — keyword-based business rule evaluation.
 *
 * Domains always considered important:
 *   Health, Finance, Work deliverables, Education, Planning
 *
 * Domains always considered not important:
 *   Entertainment, casual social activities
 */
class ImportanceEvaluator {

    private static final List<String> IMPORTANT_KEYWORDS = List.of(
            "suc khoe", "health", "tai chinh", "finance", "cong viec", "work",
            "hoc", "education", "hoc tap", "lap ke hoach", "planning", "ke hoach",
            "bao cao", "nop", "phong van", "hop dong", "du an", "project",
            "deadline", "thi", "kiem tra", "on thi", "luyen tap", "tap the duc"
    );

    private static final List<String> NOT_IMPORTANT_KEYWORDS = List.of(
            "giai tri", "entertainment", "choi game", "xem phim", "phim",
            "nhau", "tiec", "karaoke"
    );

    boolean evaluate(String title, String categoryHint) {
        String combined = DateResolver.normalizeVietnamese(
                ((title != null ? title : "") + " " + (categoryHint != null ? categoryHint : "")).toLowerCase()
        );

        for (String kw : NOT_IMPORTANT_KEYWORDS) {
            if (combined.contains(kw)) return false;
        }
        for (String kw : IMPORTANT_KEYWORDS) {
            if (combined.contains(kw)) return true;
        }
        return false;
    }
}
