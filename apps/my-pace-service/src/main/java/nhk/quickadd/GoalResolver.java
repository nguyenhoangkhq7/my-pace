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

    private boolean isWordBoundaryMatch(String text, String target) {
        if (text == null || target == null || target.isBlank()) return false;
        return text.matches(".*\\b" + Pattern.quote(target) + "\\b.*");
    }
}
