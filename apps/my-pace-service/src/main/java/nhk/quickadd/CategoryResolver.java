package nhk.quickadd;

import nhk.category.Category;

import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Deterministic fuzzy matcher: categoryHint (name string) → Category UUID.
 *
 * Match priority:
 *   1. Exact match (case-sensitive)
 *   2. Case-insensitive match
 *   3. Diacritic-insensitive match (strip Vietnamese accents)
 *   4. Acronym / Initials match (e.g. "KLTN" -> "Khóa luận tốt nghiệp")
 *   5. Word-boundary substring match (prioritize highest coverage length with word boundary)
 *   6. Fallback → null
 *
 * UUIDs are NEVER exposed to the LLM. Only names are shown in the prompt.
 */
class CategoryResolver {

    UUID resolve(String hint, List<Category> categories) {
        if (hint == null || hint.isBlank() || categories == null || categories.isEmpty()) return null;

        String trimmed = hint.trim().replaceFirst("^#+", "").trim();
        String deUnderscored = trimmed.replace('_', ' ').replace('-', ' ').trim();
        String normHint = DateResolver.normalizeVietnamese(deUnderscored.toLowerCase());

        // 1. Exact match
        for (Category c : categories) {
            if (c.getName().equals(trimmed) || c.getName().equals(deUnderscored)) return c.getId();
        }
        // 2. Case-insensitive
        for (Category c : categories) {
            if (c.getName().equalsIgnoreCase(trimmed) || c.getName().equalsIgnoreCase(deUnderscored)) return c.getId();
        }
        // 3. Diacritic-insensitive
        for (Category c : categories) {
            String normName = DateResolver.normalizeVietnamese(c.getName().toLowerCase());
            if (normName.equals(normHint)) return c.getId();
        }
        // 4. Acronym / Initials match (e.g. "KLTN" -> "Khóa luận tốt nghiệp")
        for (Category c : categories) {
            String acronym = buildAcronym(c.getName());
            if (!acronym.isEmpty() && acronym.equalsIgnoreCase(normHint)) return c.getId();
        }
        // 5. Word-boundary / High-coverage match (prevents false matches on short words)
        UUID bestMatchId = null;
        int maxMatchLen = 0;
        for (Category c : categories) {
            String normName = DateResolver.normalizeVietnamese(c.getName().toLowerCase());
            boolean wordMatch = isWordBoundaryMatch(normName, normHint) || isWordBoundaryMatch(normHint, normName);
            if (wordMatch) {
                int matchLen = Math.min(normName.length(), normHint.length());
                if (matchLen > maxMatchLen && matchLen >= 2) {
                    maxMatchLen = matchLen;
                    bestMatchId = c.getId();
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
