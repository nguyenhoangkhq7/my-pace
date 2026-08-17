package nhk.quickadd;

import nhk.goal.Goal;

import java.util.List;
import java.util.UUID;

/**
 * Deterministic fuzzy matcher: goalHint (name string) → Goal UUID.
 * Same strategy as {@link CategoryResolver}. UUIDs never exposed to LLM.
 */
class GoalResolver {

    UUID resolve(String hint, List<Goal> goals) {
        if (hint == null || hint.isBlank() || goals == null || goals.isEmpty()) return null;

        String trimmed = hint.trim();
        String normHint = DateResolver.normalizeVietnamese(trimmed.toLowerCase());

        // 1. Exact match
        for (Goal g : goals) {
            if (g.getTitle().equals(trimmed)) return g.getId();
        }
        // 2. Case-insensitive
        for (Goal g : goals) {
            if (g.getTitle().equalsIgnoreCase(trimmed)) return g.getId();
        }
        // 3. Diacritic-insensitive
        for (Goal g : goals) {
            if (DateResolver.normalizeVietnamese(g.getTitle().toLowerCase()).equals(normHint)) return g.getId();
        }
        // 4. Acronym / Initials match (e.g. "KLTN" -> "Khóa luận tốt nghiệp")
        for (Goal g : goals) {
            String acronym = CategoryResolver.buildAcronym(g.getTitle());
            if (!acronym.isEmpty() && acronym.equalsIgnoreCase(normHint)) return g.getId();
        }
        // 5. Longest / Best substring match (prioritize highest coverage length)
        UUID bestMatchId = null;
        int maxMatchLen = 0;
        for (Goal g : goals) {
            String normTitle = DateResolver.normalizeVietnamese(g.getTitle().toLowerCase());
            int matchLen = 0;
            if (normTitle.contains(normHint)) {
                matchLen = normHint.length();
            } else if (normHint.contains(normTitle)) {
                matchLen = normTitle.length();
            }
            if (matchLen > maxMatchLen && matchLen >= 2) {
                maxMatchLen = matchLen;
                bestMatchId = g.getId();
            }
        }
        if (bestMatchId != null) {
            return bestMatchId;
        }

        return null;
    }
}
