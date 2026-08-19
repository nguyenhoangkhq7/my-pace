package nhk.quickadd;

import nhk.category.Category;
import nhk.quickadd.lexicon.CategoryMatch;

import java.util.List;
import java.util.Map;
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

    private static final Map<String, List<String>> DOMAIN_SYNONYMS = Map.ofEntries(
            Map.entry("HEALTH", List.of("suc khoe", "health", "y te", "kham benh", "bac si", "y khoa", "chua benh", "kham")),
            Map.entry("FITNESS", List.of("the thao", "the duc", "fitness", "gym", "luyen tap", "chay bo", "tap luyen", "suc khoe")),
            Map.entry("EDUCATION", List.of("hoc tap", "hoc", "study", "education", "khoa hoc", "truong hoc", "on thi", "nghien cuu", "dao tao", "bai tap", "bai hoc")),
            Map.entry("WORK", List.of("cong viec", "work", "du an", "project", "co quan", "van phong", "kinh doanh", "su nghiep", "career", "job")),
            Map.entry("TECHNOLOGY", List.of("cong nghe", "technology", "tech", "lap trinh", "coding", "it", "phan mem", "ky thuat", "code", "dev", "cong viec")),
            Map.entry("FINANCE", List.of("tai chinh", "finance", "tien bac", "chi tieu", "ngan hang", "dau tu", "tiet kiem", "thu chi", "tien")),
            Map.entry("FAMILY", List.of("gia dinh", "family", "nha", "con cai", "bo me", "nguoi than")),
            Map.entry("HOME", List.of("nha cua", "nha", "home", "gia dinh", "don dep", "nha o", "doi song")),
            Map.entry("TRAVEL", List.of("du lich", "travel", "cong tac", "di lai", "chuyen di", "phuot", "nghi duong")),
            Map.entry("PRODUCTIVITY", List.of("phat trien ban than", "nang suat", "ke hoach", "productivity", "thoi quen", "muc tieu")),
            Map.entry("COMMUNITY", List.of("cong dong", "community", "tinh nguyen", "xa hoi", "hoat dong xa hoi")),
            Map.entry("LEGAL", List.of("phap ly", "legal", "thu tuc", "giay to", "hanh chinh")),
            Map.entry("SHOPPING", List.of("mua sam", "shopping", "di cho", "sieu thi", "mua do", "tap hoa", "mua hang")),
            Map.entry("ENTERTAINMENT", List.of("giai tri", "entertainment", "xem phim", "thu gian", "choi game")),
            Map.entry("GAMING", List.of("giai tri", "entertainment", "choi game", "game", "lien quan", "lien minh")),
            Map.entry("GOAL", List.of("muc tieu", "goal", "kpi", "okr", "ke hoach"))
    );

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

    /**
     * Resolves a Category directly by scanning the raw input text for acronyms or full/substring category names.
     */
    UUID resolveFromText(String rawText, List<Category> categories) {
        if (rawText == null || rawText.isBlank() || categories == null || categories.isEmpty()) return null;

        String normRawText = DateResolver.normalizeVietnamese(rawText.toLowerCase());

        // 1. Acronym match (e.g. "DA" in "Làm DA tối nay")
        for (Category c : categories) {
            if (c.getName() == null || c.getName().isBlank()) continue;
            String acronym = buildAcronym(c.getName());
            if (!acronym.isEmpty() && isWordBoundaryMatch(normRawText, acronym.toLowerCase())) {
                return c.getId();
            }
        }

        // 2. Direct name match in text (longest match first)
        UUID bestMatchId = null;
        int maxMatchLen = 0;
        for (Category c : categories) {
            if (c.getName() == null || c.getName().isBlank()) continue;
            String normName = DateResolver.normalizeVietnamese(c.getName().toLowerCase().trim());
            if (normName.length() < 3) continue; // Avoid short false positives
            if (isWordBoundaryMatch(normRawText, normName)) {
                if (normName.length() > maxMatchLen) {
                    maxMatchLen = normName.length();
                    bestMatchId = c.getId();
                }
            }
        }

        return bestMatchId;
    }

    /**
     * Fallback resolution mapping detected domain signals (from LexiconManager / domain_signals.json)
     * to matching user categories.
     */
    UUID resolveFromDomain(List<CategoryMatch> domainSignals, List<Category> categories) {
        if (domainSignals == null || domainSignals.isEmpty() || categories == null || categories.isEmpty()) return null;

        for (CategoryMatch match : domainSignals) {
            if (match == null || match.category() == null) continue;
            String domain = match.category().toUpperCase();
            List<String> synonyms = DOMAIN_SYNONYMS.get(domain);
            if (synonyms == null) continue;

            // Pass 1: Exact match with synonym (e.g. Category "Công việc" == synonym "cong viec")
            for (Category c : categories) {
                if (c.getName() == null || c.getName().isBlank()) continue;
                String normCat = DateResolver.normalizeVietnamese(c.getName().toLowerCase().trim());
                for (String syn : synonyms) {
                    if (normCat.equals(syn)) {
                        return c.getId();
                    }
                }
            }

            // Pass 2: Word-boundary substring match (e.g. "Project cá nhân" matches "project")
            for (Category c : categories) {
                if (c.getName() == null || c.getName().isBlank()) continue;
                String normCat = DateResolver.normalizeVietnamese(c.getName().toLowerCase().trim());
                for (String syn : synonyms) {
                    if (isWordBoundaryMatch(normCat, syn) || isWordBoundaryMatch(syn, normCat)) {
                        return c.getId();
                    }
                }
            }
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
