package nhk.quickadd;

import nhk.quickadd.lexicon.CategoryMatch;
import java.util.List;

public record PreClassificationState(
        boolean isImportanceConfident,
        boolean isUrgencyConfident,
        int localImportanceScore,
        int localUrgencyScore,
        List<CategoryMatch> domainSignals,
        List<CategoryMatch> strongImportanceSignals,
        List<CategoryMatch> urgencySignals,
        List<CategoryMatch> notImportantSignals,
        String reason
) {}
