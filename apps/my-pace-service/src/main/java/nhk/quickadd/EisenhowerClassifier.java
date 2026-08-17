package nhk.quickadd;

import lombok.extern.slf4j.Slf4j;
import nhk.goal.Goal;
import nhk.quickadd.lexicon.CategoryMatch;
import nhk.quickadd.lexicon.LexiconManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Eisenhower Matrix Classifier.
 *
 * Coordinates signal extraction, deterministic scoring, and quadrant mapping (Q1/Q2/Q3/Q4).
 * Generates an internal DecisionTrace for explainability and debugging.
 */
@Slf4j
@Component
public class EisenhowerClassifier {

    private static final int SCORE_THRESHOLD = 50;

    private final EisenhowerSignalExtractor signalExtractor;
    private final EisenhowerScorer scorer;

    @Autowired
    public EisenhowerClassifier(EisenhowerSignalExtractor signalExtractor, EisenhowerScorer scorer) {
        this.signalExtractor = signalExtractor;
        this.scorer = scorer;
    }

    /**
     * Backward-compatible constructor for testing and standalone usage.
     */
    public EisenhowerClassifier(LexiconManager lexiconManager) {
        this(new EisenhowerSignalExtractor(lexiconManager), new EisenhowerScorer());
    }

    /**
     * Pre-evaluation of signals before LLM call (used in hybrid prompt building & fast-path).
     */
    public PreClassificationState preEvaluate(String rawText, List<Goal> activeGoals, ZonedDateTime now) {
        EisenhowerSignals signals = signalExtractor.extract(rawText, activeGoals, null, now);
        EisenhowerScores preScores = scorer.calculateScores(signals, null, null);

        boolean hasLocalImportance = signals.goalAligned()
                || !signals.strongImportanceSignals().isEmpty()
                || !signals.domainSignals().isEmpty()
                || !signals.notImportantSignals().isEmpty()
                || signals.negatedImportance();
        boolean hasLocalUrgency = !signals.urgencySignals().isEmpty() || signals.negatedUrgency();

        String reason = generateReason(
                signals.domainSignals(),
                signals.strongImportanceSignals(),
                signals.urgencySignals(),
                signals.notImportantSignals(),
                signals.goalAligned(),
                false
        );

        return new PreClassificationState(
                hasLocalImportance,
                hasLocalUrgency,
                preScores.importanceScore(),
                preScores.urgencyScore(),
                signals.domainSignals(),
                signals.strongImportanceSignals(),
                signals.urgencySignals(),
                reason
        );
    }

    /**
     * Post-evaluates full signals (including resolved due dates and optional LLM semantic scores)
     * and produces the final quadrant classification along with a DecisionTrace.
     */
    public ClassificationResult postEvaluate(
            PreClassificationState preState,
            Double iScoreLLM,
            Double uScoreLLM,
            LocalDateTime resolvedDueDate,
            ZonedDateTime now
    ) {
        int finalImportance = preState.isImportanceConfident() ? preState.localImportanceScore() :
                (iScoreLLM != null ? (int) Math.round(iScoreLLM * 100) : 0);

        int finalUrgency = preState.isUrgencyConfident() ? preState.localUrgencyScore() :
                (uScoreLLM != null ? (int) Math.round(uScoreLLM * 100) : 0);

        boolean hasClockUrgency = false;
        boolean isTrivialCasual = finalImportance < 0;
        if (resolvedDueDate != null && !isTrivialCasual && now != null) {
            LocalDateTime threshold = now.toLocalDateTime().plusHours(48);
            if (resolvedDueDate.isBefore(now.toLocalDateTime())) {
                finalUrgency = 100;
                hasClockUrgency = true;
            } else if (resolvedDueDate.isBefore(threshold)) {
                finalUrgency = Math.max(finalUrgency, 80);
                hasClockUrgency = true;
            }
        }

        return buildClassificationResult(
                finalImportance,
                finalUrgency,
                preState.domainSignals(),
                preState.strongImportanceSignals(),
                preState.urgencySignals(),
                hasClockUrgency,
                preState.reason(),
                iScoreLLM,
                uScoreLLM,
                preState.isImportanceConfident(),
                preState.isUrgencyConfident()
        );
    }

    /**
     * Direct evaluation pipeline using modern signal extractor and scorer.
     */
    public ClassificationResult evaluate(
            String rawText,
            List<Goal> activeGoals,
            LocalDateTime resolvedDueDate,
            ZonedDateTime now,
            Double iScoreLLM,
            Double uScoreLLM
    ) {
        EisenhowerSignals signals = signalExtractor.extract(rawText, activeGoals, resolvedDueDate, now);
        EisenhowerScores scores = scorer.calculateScores(signals, iScoreLLM, uScoreLLM);

        boolean hasLocalImportance = signals.goalAligned()
                || !signals.strongImportanceSignals().isEmpty()
                || !signals.domainSignals().isEmpty()
                || !signals.notImportantSignals().isEmpty()
                || signals.negatedImportance();
        boolean hasLocalUrgency = !signals.urgencySignals().isEmpty() || signals.negatedUrgency();

        boolean hasClockUrgency = (signals.isOverdue() || signals.deadlineWithin48Hours()) && scores.importanceScore() >= 0;

        String baseReason = generateReason(
                signals.domainSignals(),
                signals.strongImportanceSignals(),
                signals.urgencySignals(),
                signals.notImportantSignals(),
                signals.goalAligned(),
                hasClockUrgency
        );

        return buildClassificationResult(
                scores.importanceScore(),
                scores.urgencyScore(),
                signals.domainSignals(),
                signals.strongImportanceSignals(),
                signals.urgencySignals(),
                hasClockUrgency,
                baseReason,
                iScoreLLM,
                uScoreLLM,
                hasLocalImportance,
                hasLocalUrgency
        );
    }

    private ClassificationResult buildClassificationResult(
            int finalImportance,
            int finalUrgency,
            List<CategoryMatch> domainSignals,
            List<CategoryMatch> strongImportanceSignals,
            List<CategoryMatch> urgencySignals,
            boolean hasClockUrgency,
            String baseReason,
            Double iScoreLLM,
            Double uScoreLLM,
            boolean isImportanceConfident,
            boolean isUrgencyConfident
    ) {
        boolean isImportant = finalImportance >= SCORE_THRESHOLD;
        boolean isUrgent = finalUrgency >= SCORE_THRESHOLD;

        String quadrant;
        if (isImportant && isUrgent) quadrant = "Q1";
        else if (isImportant && !isUrgent) quadrant = "Q2";
        else if (!isImportant && isUrgent) quadrant = "Q3";
        else quadrant = "Q4";

        List<CategoryMatch> matchedCategories = new ArrayList<>();
        matchedCategories.addAll(domainSignals);
        matchedCategories.addAll(strongImportanceSignals);
        matchedCategories.addAll(urgencySignals);

        if (hasClockUrgency) {
            matchedCategories.add(new CategoryMatch("CLOCK_URGENT", "Time constraint matched", 100));
        }

        String finalReason = baseReason;
        if (hasClockUrgency && !finalReason.contains("CLOCK_URGENT")) {
            finalReason = finalReason.replace("Local signals: ", "Local signals: CLOCK_URGENT, ");
        }
        if (!isImportanceConfident && iScoreLLM != null) {
            finalReason += String.format(" [LLM Importance Fallback: %.2f]", iScoreLLM);
        }
        if (!isUrgencyConfident && uScoreLLM != null) {
            finalReason += String.format(" [LLM Urgency Fallback: %.2f]", uScoreLLM);
        }

        // Build DecisionTrace
        List<String> traceSignals = new ArrayList<>();
        if (matchedCategories.stream().anyMatch(m -> "GOAL".equals(m.category()) || "GOAL_ALIGNED".equals(m.category())) || baseReason.contains("GOAL_ALIGNED")) {
            traceSignals.add("GOAL_ALIGNED");
        }
        if (hasClockUrgency) {
            traceSignals.add("CLOCK_URGENT");
        }
        for (CategoryMatch match : matchedCategories) {
            if (!traceSignals.contains(match.category())) {
                traceSignals.add(match.category());
            }
        }

        Map<String, Object> sources = new LinkedHashMap<>();
        sources.put("importanceScore", finalImportance);
        sources.put("urgencyScore", finalUrgency);
        sources.put("importanceSource", isImportanceConfident ? "LOCAL_RULE" : (iScoreLLM != null ? "LLM_FALLBACK" : "DEFAULT"));
        sources.put("urgencySource", isUrgencyConfident ? "LOCAL_RULE" : (uScoreLLM != null ? "LLM_FALLBACK" : (hasClockUrgency ? "CLOCK_OVERRIDE" : "DEFAULT")));
        if (iScoreLLM != null) sources.put("llmImportanceHint", iScoreLLM);
        if (uScoreLLM != null) sources.put("llmUrgencyHint", uScoreLLM);

        DecisionTrace trace = new DecisionTrace(finalImportance, finalUrgency, traceSignals, sources);
        log.debug("Eisenhower Decision Trace: quadrant={}, importance={}, urgency={}, signals={}",
                quadrant, finalImportance, finalUrgency, traceSignals);

        return new ClassificationResult(
                isImportant,
                isUrgent,
                finalImportance,
                finalUrgency,
                quadrant,
                matchedCategories,
                finalReason,
                trace
        );
    }

    private String generateReason(
            List<CategoryMatch> domains,
            List<CategoryMatch> strongImp,
            List<CategoryMatch> urg,
            List<CategoryMatch> notImp,
            boolean hasGoal,
            boolean hasClockUrgency
    ) {
        List<String> signals = new ArrayList<>();
        if (hasGoal) signals.add("GOAL_ALIGNED");
        if (hasClockUrgency) signals.add("CLOCK_URGENT");

        domains.stream().map(CategoryMatch::category).distinct().limit(2).forEach(signals::add);
        strongImp.stream().map(CategoryMatch::category).distinct().limit(2).forEach(signals::add);
        urg.stream().map(CategoryMatch::category).distinct().limit(2).forEach(signals::add);
        notImp.stream().map(CategoryMatch::category).distinct().limit(2).forEach(signals::add);

        if (signals.isEmpty()) return "No local signals detected.";
        return "Local signals: " + String.join(", ", signals) + ".";
    }
}
