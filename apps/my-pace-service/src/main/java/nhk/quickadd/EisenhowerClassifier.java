package nhk.quickadd;

import nhk.quickadd.lexicon.CategoryMatch;
import nhk.quickadd.lexicon.LexiconManager;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class EisenhowerClassifier {

    private final LexiconManager lexiconManager;
    private static final int SCORE_THRESHOLD = 50;

    public EisenhowerClassifier(LexiconManager lexiconManager) {
        this.lexiconManager = lexiconManager;
    }

    public PreClassificationState preEvaluate(String rawText, List<nhk.goal.Goal> activeGoals, ZonedDateTime now) {
        String normalizedText = LexiconManager.normalize(rawText);

        // 1. Process Negation to mask out ignored phrases
        List<CategoryMatch> negations = lexiconManager.findMatches(normalizedText, LexiconManager.LexiconType.NEGATION);
        String textForEval = lexiconManager.maskNegations(normalizedText, negations);

        // 2. Extract Signals
        List<CategoryMatch> domainSignals = lexiconManager.findMatches(textForEval, LexiconManager.LexiconType.DOMAIN);
        List<CategoryMatch> strongImportanceSignals = lexiconManager.findMatches(textForEval, LexiconManager.LexiconType.STRONG_IMPORTANCE);
        List<CategoryMatch> urgencySignals = lexiconManager.findMatches(textForEval, LexiconManager.LexiconType.URGENCY);
        List<CategoryMatch> notImportantSignals = lexiconManager.findMatches(textForEval, LexiconManager.LexiconType.NOT_IMPORTANT);

        int localImportanceScore = 0;
        int localUrgencyScore = 0;

        // Add scores for strong signals
        for (CategoryMatch match : strongImportanceSignals) localImportanceScore += match.score();
        for (CategoryMatch match : urgencySignals) localUrgencyScore += match.score();
        for (CategoryMatch match : notImportantSignals) localImportanceScore += match.score(); // Negative scores

        // Process negative items from negations if applicable (e.g. "không quan trọng")
        for (CategoryMatch match : negations) {
            if (match.category().equals("NOT_IMPORTANT") || match.category().equals("JUST_FOR_FUN")) {
                localImportanceScore += match.score(); // negative score
            }
            if (match.category().equals("NOT_URGENT")) {
                localUrgencyScore += match.score(); // negative score
            }
        }

        // 3. Goal Alignment (Strong deterministic Importance)
        boolean hasGoal = false;
        if (activeGoals != null) {
            for (nhk.goal.Goal g : activeGoals) {
                if (g.getTitle() != null && normalizedText.contains(LexiconManager.normalize(g.getTitle()))) {
                    hasGoal = true;
                    break;
                }
            }
        }
        
        if (hasGoal) {
            localImportanceScore += 100;
        }

        // 4. Compute Confidences
        // Urgency is confident if we have explicit urgency keyword
        boolean isUrgencyConfident = !urgencySignals.isEmpty() || hasNegativeUrgency(negations);
        
        // Importance is confident if we have direct goal alignment, explicit critical consequence, or explicitly marked as not important
        boolean isImportanceConfident = hasGoal || !strongImportanceSignals.isEmpty() || !notImportantSignals.isEmpty() || hasNegativeImportance(negations);

        // We do NOT use domainSignals to calculate importance score or confidence per Rule #6.

        String reason = generateReason(domainSignals, strongImportanceSignals, urgencySignals, notImportantSignals, hasGoal, false);

        return new PreClassificationState(
                isImportanceConfident,
                isUrgencyConfident,
                localImportanceScore,
                localUrgencyScore,
                domainSignals,
                strongImportanceSignals,
                urgencySignals,
                reason
        );
    }
    
    private boolean hasNegativeUrgency(List<CategoryMatch> negations) {
        return negations.stream().anyMatch(m -> m.category().equals("NOT_URGENT"));
    }
    
    private boolean hasNegativeImportance(List<CategoryMatch> negations) {
        return negations.stream().anyMatch(m -> m.category().equals("NOT_IMPORTANT") || m.category().equals("JUST_FOR_FUN"));
    }

    public ClassificationResult postEvaluate(PreClassificationState preState, Double iScoreLLM, Double uScoreLLM, LocalDateTime resolvedDueDate, ZonedDateTime now) {
        int finalImportance = preState.isImportanceConfident() ? preState.localImportanceScore() :
                (iScoreLLM != null ? (int) Math.round(iScoreLLM * 100) : 0);
                
        int finalUrgency = preState.isUrgencyConfident() ? preState.localUrgencyScore() :
                (uScoreLLM != null ? (int) Math.round(uScoreLLM * 100) : 0);
                
        // Post-evaluate Clock Urgency
        boolean hasClockUrgency = false;
        if (resolvedDueDate != null) {
            LocalDateTime threshold = now.toLocalDateTime().plusHours(48);
            if (resolvedDueDate.isBefore(now.toLocalDateTime())) {
                finalUrgency = 100; // Overdue overrides everything
                hasClockUrgency = true;
            } else if (resolvedDueDate.isBefore(threshold)) {
                finalUrgency = Math.max(finalUrgency, 80);
                hasClockUrgency = true;
            }
        }

        boolean isImportant = finalImportance >= SCORE_THRESHOLD;
        boolean isUrgent = finalUrgency >= SCORE_THRESHOLD;

        String quadrant;
        if (isImportant && isUrgent) quadrant = "Q1";
        else if (isImportant && !isUrgent) quadrant = "Q2";
        else if (!isImportant && isUrgent) quadrant = "Q3";
        else quadrant = "Q4";

        List<CategoryMatch> matchedCategories = new ArrayList<>();
        matchedCategories.addAll(preState.domainSignals());
        matchedCategories.addAll(preState.strongImportanceSignals());
        matchedCategories.addAll(preState.urgencySignals());

        if (hasClockUrgency) {
            matchedCategories.add(new CategoryMatch("CLOCK_URGENT", "Time constraint matched", 100));
        }

        String finalReason = preState.reason();
        if (hasClockUrgency && !finalReason.contains("CLOCK_URGENT")) {
            finalReason = finalReason.replace("Local signals: ", "Local signals: CLOCK_URGENT, ");
        }
        if (!preState.isImportanceConfident() && iScoreLLM != null) {
            finalReason += String.format(" [LLM Importance Fallback: %.2f]", iScoreLLM);
        }
        if (!preState.isUrgencyConfident() && uScoreLLM != null) {
            finalReason += String.format(" [LLM Urgency Fallback: %.2f]", uScoreLLM);
        }

        return new ClassificationResult(
                isImportant,
                isUrgent,
                finalImportance,
                finalUrgency,
                quadrant,
                matchedCategories,
                finalReason
        );
    }

    private String generateReason(List<CategoryMatch> domains, List<CategoryMatch> strongImp, List<CategoryMatch> urg, List<CategoryMatch> notImp, boolean hasGoal, boolean hasClockUrgency) {
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
