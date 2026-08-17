package nhk.quickadd;

import nhk.category.Category;

import java.util.List;
import java.util.UUID;

/**
 * Deterministic fuzzy matcher: categoryHint (name string) → Category UUID.
 *
 * Match priority:
 *   1. Exact match (case-sensitive)
 *   2. Case-insensitive match
 *   3. Diacritic-insensitive match (strip Vietnamese accents)
 *   4. Contains match (either side)
 *   5. Fallback → null
 *
 * UUIDs are NEVER exposed to the LLM. Only names are shown in the prompt.
 */
class CategoryResolver {

    UUID resolve(String hint, List<Category> categories) {
        if (hint == null || hint.isBlank() || categories == null || categories.isEmpty()) return null;

        String trimmed = hint.trim();
        String normHint = DateResolver.normalizeVietnamese(trimmed.toLowerCase());

        // 1. Exact match
        for (Category c : categories) {
            if (c.getName().equals(trimmed)) return c.getId();
        }
        // 2. Case-insensitive
        for (Category c : categories) {
            if (c.getName().equalsIgnoreCase(trimmed)) return c.getId();
        }
        // 3. Diacritic-insensitive
        for (Category c : categories) {
            if (DateResolver.normalizeVietnamese(c.getName().toLowerCase()).equals(normHint)) return c.getId();
        }
        // 4. Acronym / Initials match (e.g. "KLTN" -> "Khóa luận tốt nghiệp")
        for (Category c : categories) {
            String acronym = buildAcronym(c.getName());
            if (!acronym.isEmpty() && acronym.equalsIgnoreCase(normHint)) return c.getId();
        }
        // 5. Longest / Best substring match (prioritize highest coverage length)
        UUID bestMatchId = null;
        int maxMatchLen = 0;
        for (Category c : categories) {
            String normName = DateResolver.normalizeVietnamese(c.getName().toLowerCase());
            int matchLen = 0;
            if (normName.contains(normHint)) {
                matchLen = normHint.length();
            } else if (normHint.contains(normName)) {
                matchLen = normName.length();
            }
            if (matchLen > maxMatchLen && matchLen >= 2) {
                maxMatchLen = matchLen;
                bestMatchId = c.getId();
            }
        }
        if (bestMatchId != null) {
            return bestMatchId;
        }

        return null;
    }

    static String buildAcronym(String name) {
        if (name == null || name.isBlank()) return "";
        String normalized = DateResolver.normalizeVietnamese(name.trim().toLowerCase()).replaceAll("[^a-z0-9\\s]", " ");
        String[] words = normalized.split("\\s+");
        if (words.length <= 1) return "";
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isBlank()) {
                sb.append(w.charAt(0));
            }
        }
        return sb.toString();
    }
}
