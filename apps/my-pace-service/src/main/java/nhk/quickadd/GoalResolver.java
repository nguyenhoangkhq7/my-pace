package nhk.quickadd;

import nhk.goal.Goal;

import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Deterministic fuzzy matcher: goalHint (name string) → Goal UUID.
 * Same strategy as {@link CategoryResolver}. UUIDs never exposed to LLM.
 */
class GoalResolver {

    UUID resolve(String hint, List<Goal> goals) {
        if (hint == null || hint.isBlank() || goals == null || goals.isEmpty()) return null;

        String trimmed = hint.trim().replaceFirst("^@+", "").trim();
        String deUnderscored = trimmed.replace('_', ' ').replace('-', ' ').trim();
        String normHint = DateResolver.normalizeVietnamese(deUnderscored.toLowerCase());

        // 1. Exact match
        for (Goal g : goals) {
            if (g.getTitle().equals(trimmed) || g.getTitle().equals(deUnderscored)) return g.getId();
        }
        // 2. Case-insensitive
        for (Goal g : goals) {
            if (g.getTitle().equalsIgnoreCase(trimmed) || g.getTitle().equalsIgnoreCase(deUnderscored)) return g.getId();
        }
        // 3. Diacritic-insensitive
        for (Goal g : goals) {
            String normTitle = DateResolver.normalizeVietnamese(g.getTitle().toLowerCase());
            if (normTitle.equals(normHint)) return g.getId();
        }
        // 4. Acronym / Initials match (e.g. "KLTN" -> "Khóa luận tốt nghiệp")
        for (Goal g : goals) {
            String acronym = CategoryResolver.buildAcronym(g.getTitle());
            if (!acronym.isEmpty() && acronym.equalsIgnoreCase(normHint)) return g.getId();
        }
        // 5. Word-boundary / High-coverage match (prevents false matches on short words)
        UUID bestMatchId = null;
        int maxMatchLen = 0;
        for (Goal g : goals) {
            String normTitle = DateResolver.normalizeVietnamese(g.getTitle().toLowerCase());
            boolean wordMatch = isWordBoundaryMatch(normTitle, normHint) || isWordBoundaryMatch(normHint, normTitle);
            if (wordMatch) {
                int matchLen = Math.min(normTitle.length(), normHint.length());
                if (matchLen > maxMatchLen && matchLen >= 2) {
                    maxMatchLen = matchLen;
                    bestMatchId = g.getId();
                }
            }
        }
        if (bestMatchId != null) {
            return bestMatchId;
        }

        return null;
    }

    /**
     * Resolves a Goal directly by scanning the raw input text for acronyms or full/substring titles.
     */
    UUID resolveFromText(String rawText, List<Goal> goals) {
        if (rawText == null || rawText.isBlank() || goals == null || goals.isEmpty()) return null;

        String normRawText = DateResolver.normalizeVietnamese(rawText.toLowerCase());

        // 1. Acronym match (e.g. "KLTN" in "Làm slide KLTN tối nay")
        for (Goal g : goals) {
            if (g.getTitle() == null || g.getTitle().isBlank()) continue;
            String acronym = CategoryResolver.buildAcronym(g.getTitle());
            if (!acronym.isEmpty() && isWordBoundaryMatch(normRawText, acronym.toLowerCase())) {
                return g.getId();
            }
        }

        // 2. Full title or multi-word substring match in rawText (longest title first)
        UUID bestMatchId = null;
        int maxMatchLen = 0;
        for (Goal g : goals) {
            if (g.getTitle() == null || g.getTitle().isBlank()) continue;
            String normTitle = DateResolver.normalizeVietnamese(g.getTitle().toLowerCase().trim());
            if (normTitle.length() < 3) continue; // Avoid short false positives
            if (isWordBoundaryMatch(normRawText, normTitle)) {
                if (normTitle.length() > maxMatchLen) {
                    maxMatchLen = normTitle.length();
                    bestMatchId = g.getId();
                }
            }
        }
        if (bestMatchId != null) return bestMatchId;

        // 3. Significant keyword token match (e.g. "IELTS" in Goal "IELTS 7.5", "Marathon" in "Chạy Marathon 2026")
        for (Goal g : goals) {
            if (g.getTitle() == null || g.getTitle().isBlank()) continue;
            String normTitle = DateResolver.normalizeVietnamese(g.getTitle().toLowerCase().trim());
            String[] tokens = normTitle.split("\\s+");
            for (String token : tokens) {
                if (token.length() >= 4 && isWordBoundaryMatch(normRawText, token)) {
                    return g.getId();
                }
            }
        }

        return null;
    }

    private boolean isWordBoundaryMatch(String text, String target) {
        if (text == null || target == null || target.isBlank()) return false;
        return text.matches(".*\\b" + Pattern.quote(target) + "\\b.*");
    }
}
