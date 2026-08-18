package nhk.quickadd;

import nhk.quickadd.lexicon.CategoryMatch;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Converts extracted raw Eisenhower signals into deterministic importance and urgency scores.
 * All scoring calculations are explainable and rule-based.
 */
@Component
public class EisenhowerScorer {

    public EisenhowerScores calculateScores(EisenhowerSignals signals, Double iScoreLLM, Double uScoreLLM) {
        Map<String, Integer> breakdown = new LinkedHashMap<>();

        // ── 1. Importance Calculation ─────────────────────────────────────────────
        int localImportanceScore = 0;

        int domainScore = signals.domainSignals().stream().mapToInt(CategoryMatch::score).sum();
        int strongImpScore = signals.strongImportanceSignals().stream().mapToInt(CategoryMatch::score).sum();
        int notImpScore = signals.notImportantSignals().stream().mapToInt(CategoryMatch::score).sum();

        localImportanceScore += domainScore + strongImpScore + notImpScore;
        if (domainScore != 0) breakdown.put("domainSignals", domainScore);
        if (strongImpScore != 0) breakdown.put("strongImportance", strongImpScore);
        if (notImpScore != 0) breakdown.put("notImportantSignals", notImpScore);

        int negationImpScore = 0;
        for (CategoryMatch match : signals.negations()) {
            if ("NOT_IMPORTANT".equals(match.category()) || "JUST_FOR_FUN".equals(match.category())) {
                negationImpScore += match.score();
            }
        }
        if (negationImpScore != 0) {
            localImportanceScore += negationImpScore;
            breakdown.put("negatedImportance", negationImpScore);
        }

        if (signals.goalAligned()) {
            localImportanceScore += 100;
            breakdown.put("goalAlignment", 100);
        }

        boolean hasLocalImportanceEvidence = signals.goalAligned()
                || !signals.strongImportanceSignals().isEmpty()
                || !signals.domainSignals().isEmpty()
                || !signals.notImportantSignals().isEmpty()
                || signals.negatedImportance();

        int finalImportance;
        if (hasLocalImportanceEvidence) {
            finalImportance = localImportanceScore;
            breakdown.put("finalImportanceSource_Local", localImportanceScore);
        } else if (iScoreLLM != null) {
            finalImportance = (int) Math.round(iScoreLLM * 100);
            breakdown.put("finalImportanceSource_LLMFallback", finalImportance);
        } else {
            finalImportance = 0;
            breakdown.put("finalImportanceSource_Default", 0);
        }

        // ── 2. Urgency Calculation ────────────────────────────────────────────────
        int localUrgencyScore = 0;

        int urgSignalsScore = signals.urgencySignals().stream().mapToInt(CategoryMatch::score).sum();
        localUrgencyScore += urgSignalsScore;
        if (urgSignalsScore != 0) breakdown.put("urgencySignals", urgSignalsScore);

        int negationUrgScore = 0;
        for (CategoryMatch match : signals.negations()) {
            if ("NOT_URGENT".equals(match.category())) {
                negationUrgScore += match.score();
            }
        }
        if (negationUrgScore != 0) {
            localUrgencyScore += negationUrgScore;
            breakdown.put("negatedUrgency", negationUrgScore);
        }

        boolean hasLocalUrgencyEvidence = !signals.urgencySignals().isEmpty() || signals.negatedUrgency();

        int finalUrgency;
        if (hasLocalUrgencyEvidence) {
            finalUrgency = localUrgencyScore;
            breakdown.put("finalUrgencySource_Local", localUrgencyScore);
        } else if (uScoreLLM != null) {
            finalUrgency = (int) Math.round(uScoreLLM * 100);
            breakdown.put("finalUrgencySource_LLMFallback", finalUrgency);
        } else {
            finalUrgency = 0;
            breakdown.put("finalUrgencySource_Default", 0);
        }

        // ── 3. Clock Urgency Post-Evaluation ──────────────────────────────────────
        // Clock urgency applies only to non-trivial / non-casual tasks (finalImportance >= 0)
        boolean isTrivialCasual = finalImportance < 0;
        if (!isTrivialCasual) {
            if (signals.isOverdue()) {
                finalUrgency = 100;
                breakdown.put("clockUrgency_Overdue", 100);
            } else if (signals.deadlineWithin48Hours()) {
                finalUrgency = Math.max(finalUrgency, 80);
                breakdown.put("clockUrgency_48Hours", finalUrgency);
            }
        }

        return new EisenhowerScores(finalImportance, finalUrgency, breakdown);
    }
}
