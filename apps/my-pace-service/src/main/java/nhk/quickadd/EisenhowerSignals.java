package nhk.quickadd;

import nhk.quickadd.lexicon.CategoryMatch;
import java.util.List;

/**
 * Encapsulates raw extracted signals and evidence for Eisenhower evaluation.
 * Does not contain synthetic confidence scores.
 */
public record EisenhowerSignals(
        boolean deadlineWithin48Hours,
        boolean isOverdue,
        boolean goalAligned,
        boolean urgentKeywordDetected,
        boolean importantKeywordDetected,
        boolean negatedUrgency,
        boolean negatedImportance,
        boolean isInformational,
        boolean hasExplicitTimePressure,
        List<CategoryMatch> domainSignals,
        List<CategoryMatch> strongImportanceSignals,
        List<CategoryMatch> urgencySignals,
        List<CategoryMatch> notImportantSignals,
        List<CategoryMatch> negations
) {
    public EisenhowerSignals {
        domainSignals = domainSignals != null ? List.copyOf(domainSignals) : List.of();
        strongImportanceSignals = strongImportanceSignals != null ? List.copyOf(strongImportanceSignals) : List.of();
        urgencySignals = urgencySignals != null ? List.copyOf(urgencySignals) : List.of();
        notImportantSignals = notImportantSignals != null ? List.copyOf(notImportantSignals) : List.of();
        negations = negations != null ? List.copyOf(negations) : List.of();
    }

    public boolean hasClockUrgency() {
        return isOverdue || deadlineWithin48Hours;
    }
}
