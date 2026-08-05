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
        // 4. Contains (category name contains hint OR hint contains category name)
        for (Category c : categories) {
            String normName = DateResolver.normalizeVietnamese(c.getName().toLowerCase());
            if (normName.contains(normHint) || normHint.contains(normName)) return c.getId();
        }

        return null;
    }
}
