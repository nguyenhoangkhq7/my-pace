package nhk.quickadd;

import nhk.goal.Goal;
import nhk.quickadd.lexicon.CategoryMatch;
import nhk.quickadd.lexicon.LexiconManager;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Extracts raw Eisenhower signals and evidence from user text, lexicon matches,
 * active user goals, and temporal constraints.
 *
 * Dedicated strictly to signal extraction — no scoring or quadrant classification.
 */
@Component
public class EisenhowerSignalExtractor {

    private static final Pattern INFORMATIONAL_PATTERN = Pattern.compile(
            "^(?:doc|đọc|hoc|học|nghien cuu|nghiên cứu|tim hieu|tìm hiểu|xem|tra cuu|tra cứu|doc sach|đọc sách|doc bao|đọc báo)\\b.*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Pattern EXPLICIT_TIME_PRESSURE_PATTERN = Pattern.compile(
            ".*\\b(?:gap|gấp|ngay|asap|khan|khẩn|hom nay|hôm nay|mai|ngay mai|deadline|han chot|hạn chót|truoc|trước)\\b.*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final List<String> TOPIC_URGENCY_CATEGORIES = List.of(
            "CRITICAL", "EMERGENCY", "CRITICAL_CONSEQUENCE", "DEADLINE"
    );

    private final LexiconManager lexiconManager;

    public EisenhowerSignalExtractor(LexiconManager lexiconManager) {
        this.lexiconManager = lexiconManager;
    }

    /**
     * Extracts all raw signals from user input, goals, and optional due date.
     */
    public EisenhowerSignals extract(String rawText, List<Goal> activeGoals, LocalDateTime resolvedDueDate, ZonedDateTime now) {
        String normalizedText = LexiconManager.normalize(rawText);

        // 1. Process Negation to mask out ignored phrases
        List<CategoryMatch> negations = lexiconManager.findMatches(normalizedText, LexiconManager.LexiconType.NEGATION);
        String textForEval = lexiconManager.maskNegations(normalizedText, negations);

        // 2. Extract Lexicon Signals
        List<CategoryMatch> domainSignals = lexiconManager.findMatches(textForEval, LexiconManager.LexiconType.DOMAIN);
        List<CategoryMatch> strongImportanceSignals = lexiconManager.findMatches(textForEval, LexiconManager.LexiconType.STRONG_IMPORTANCE);
        List<CategoryMatch> urgencySignals = lexiconManager.findMatches(textForEval, LexiconManager.LexiconType.URGENCY);
        List<CategoryMatch> notImportantSignals = lexiconManager.findMatches(textForEval, LexiconManager.LexiconType.NOT_IMPORTANT);

        // 3. Contextual Filter for Informational / Study Activities without explicit time pressure
        boolean isInformational = INFORMATIONAL_PATTERN.matcher(normalizedText).matches();
        boolean hasExplicitTimePressure = EXPLICIT_TIME_PRESSURE_PATTERN.matcher(normalizedText).matches();
        if (isInformational && !hasExplicitTimePressure) {
            urgencySignals = urgencySignals.stream()
                    .filter(m -> !TOPIC_URGENCY_CATEGORIES.contains(m.category()))
                    .toList();
        }

        // 4. Goal Alignment (Deterministic Importance)
        boolean goalAligned = false;
        if (activeGoals != null) {
            for (Goal g : activeGoals) {
                if (g.getTitle() != null && !g.getTitle().isBlank()) {
                    String normGoalTitle = LexiconManager.normalize(g.getTitle());
                    if (!normGoalTitle.isBlank() && normalizedText.contains(normGoalTitle)) {
                        goalAligned = true;
                        break;
                    }
                }
            }
        }

        // 5. Clock Urgency (Overdue or Due within 48 hours)
        boolean isOverdue = false;
        boolean deadlineWithin48Hours = false;
        if (resolvedDueDate != null && now != null) {
            LocalDateTime nowLdt = now.toLocalDateTime();
            if (resolvedDueDate.isBefore(nowLdt)) {
                isOverdue = true;
            } else if (resolvedDueDate.isBefore(nowLdt.plusHours(48))) {
                deadlineWithin48Hours = true;
            }
        }

        // 6. Evidence flags
        boolean negatedUrgency = negations.stream().anyMatch(m -> "NOT_URGENT".equals(m.category()));
        boolean negatedImportance = negations.stream().anyMatch(m -> "NOT_IMPORTANT".equals(m.category()) || "JUST_FOR_FUN".equals(m.category()));
        boolean urgentKeywordDetected = !urgencySignals.isEmpty();
        boolean importantKeywordDetected = !strongImportanceSignals.isEmpty() || !domainSignals.isEmpty();

        return new EisenhowerSignals(
                deadlineWithin48Hours,
                isOverdue,
                goalAligned,
                urgentKeywordDetected,
                importantKeywordDetected,
                negatedUrgency,
                negatedImportance,
                isInformational,
                hasExplicitTimePressure,
                domainSignals,
                strongImportanceSignals,
                urgencySignals,
                notImportantSignals,
                negations
        );
    }
}
