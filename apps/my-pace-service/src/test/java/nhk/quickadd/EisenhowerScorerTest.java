package nhk.quickadd;

import nhk.quickadd.lexicon.CategoryMatch;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EisenhowerScorerTest {

    private EisenhowerScorer scorer;

    @BeforeEach
    void setUp() {
        scorer = new EisenhowerScorer();
    }

    @Test
    @DisplayName("Goal alignment adds 100 to importance score")
    void testGoalAlignmentScoring() {
        EisenhowerSignals signals = new EisenhowerSignals(
                false, false, true, false, false, false, false, false, false,
                List.of(), List.of(), List.of(), List.of(), List.of()
        );

        EisenhowerScores scores = scorer.calculateScores(signals, null, null);
        assertThat(scores.importanceScore()).isEqualTo(100);
        assertThat(scores.urgencyScore()).isEqualTo(0);
        assertThat(scores.scoreBreakdown()).containsKey("goalAlignment");
    }

    @Test
    @DisplayName("Clock urgency for 48h deadline sets urgency to at least 80 for non-trivial tasks")
    void testClockUrgencyScoring() {
        EisenhowerSignals signals = new EisenhowerSignals(
                true, false, false, false, false, false, false, false, false,
                List.of(), List.of(), List.of(), List.of(), List.of()
        );

        EisenhowerScores scores = scorer.calculateScores(signals, null, null);
        assertThat(scores.urgencyScore()).isEqualTo(80);
        assertThat(scores.scoreBreakdown()).containsKey("clockUrgency_48Hours");
    }

    @Test
    @DisplayName("Overdue deadline sets urgency to 100")
    void testOverdueScoring() {
        EisenhowerSignals signals = new EisenhowerSignals(
                false, true, false, false, false, false, false, false, false,
                List.of(), List.of(), List.of(), List.of(), List.of()
        );

        EisenhowerScores scores = scorer.calculateScores(signals, null, null);
        assertThat(scores.urgencyScore()).isEqualTo(100);
        assertThat(scores.scoreBreakdown()).containsKey("clockUrgency_Overdue");
    }

    @Test
    @DisplayName("Negated importance reduces score and records in breakdown")
    void testNegatedImportance() {
        CategoryMatch notImp = new CategoryMatch("NOT_IMPORTANT", "không quan trọng", -100);
        EisenhowerSignals signals = new EisenhowerSignals(
                false, false, false, false, false, false, true, false, false,
                List.of(), List.of(), List.of(), List.of(), List.of(notImp)
        );

        EisenhowerScores scores = scorer.calculateScores(signals, null, null);
        assertThat(scores.importanceScore()).isLessThan(0);
        assertThat(scores.scoreBreakdown()).containsKey("negatedImportance");
    }
}
