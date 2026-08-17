package nhk.quickadd;

import nhk.quickadd.lexicon.CategoryMatch;
import java.util.List;

public record ClassificationResult(
        boolean isImportant,
        boolean isUrgent,
        int importanceScore,
        int urgencyScore,
        String quadrant,
        List<CategoryMatch> matchedCategories,
        String reason
) {}
