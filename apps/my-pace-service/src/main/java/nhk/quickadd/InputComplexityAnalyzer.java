package nhk.quickadd;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Lightweight ambiguity and complexity estimator for Quick Add input routing.
 *
 * FastPath uses this to safely route complex, conditional, negated, recurring,
 * or ambiguous expressions to the LLM semantic pipeline while keeping latency minimal (< 1ms).
 */
@Component
public class InputComplexityAnalyzer {

    // Sequential connectors & action transitions
    private static final Pattern SEQUENTIAL_CONNECTORS = Pattern.compile(
            "\\b(?:roi|rồi|sau do|sau đó|tiep theo|tiếp theo|xong thi|xong thì|chuyen sang|chuyển sang|doi sang|đổi sang|thay vi|thay vì|hoan|hoãn|doi|dời|then|after that)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE | Pattern.UNICODE_CHARACTER_CLASS
    );

    // Conditional expressions
    private static final Pattern CONDITIONALS = Pattern.compile(
            "\\b(?:neu|nếu|khi nao|khi nào|trong truong hop|trong trường hợp|tuy thuoc|tùy thuộc|if|unless)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE | Pattern.UNICODE_CHARACTER_CLASS
    );

    // Negations, corrections & contrast markers
    private static final Pattern NEGATIONS_AND_CORRECTIONS = Pattern.compile(
            "\\b(?:khong|không|dung|đừng|chua|chưa|a khong|à không|nhung|nhưng|tuy nhien|tuy nhiên|not|don't)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE | Pattern.UNICODE_CHARACTER_CLASS
    );

    // Recurrence markers (complex temporal rule requiring semantic parsing)
    private static final Pattern RECURRENCE_MARKERS = Pattern.compile(
            "\\b(?:lap lai|lặp lại|dinh ky|định kỳ)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE | Pattern.UNICODE_CHARACTER_CLASS
    );

    // Fuzzy or ambiguous time expressions
    private static final Pattern FUZZY_TIME = Pattern.compile(
            "\\b(?:khoang|khoảng|tam|tầm|chung|chừng|co|cỡ|chac|chắc|co le|có lẽ|around|approx|maybe)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE | Pattern.UNICODE_CHARACTER_CLASS
    );

    public ComplexityAnalysis analyze(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return new ComplexityAnalysis(false, 0, List.of());
        }

        String trimmed = rawText.trim();
        String norm = DateResolver.normalizeVietnamese(trimmed.toLowerCase());
        List<String> signals = new ArrayList<>();
        int score = 0;

        if (SEQUENTIAL_CONNECTORS.matcher(trimmed).find() || SEQUENTIAL_CONNECTORS.matcher(norm).find()) {
            signals.add("SEQUENTIAL_CONNECTOR");
            score += 10;
        }
        if (CONDITIONALS.matcher(trimmed).find() || CONDITIONALS.matcher(norm).find()) {
            signals.add("CONDITIONAL");
            score += 15;
        }
        if (NEGATIONS_AND_CORRECTIONS.matcher(trimmed).find() || NEGATIONS_AND_CORRECTIONS.matcher(norm).find()) {
            signals.add("NEGATION_OR_CORRECTION");
            score += 10;
        }
        if (RECURRENCE_MARKERS.matcher(trimmed).find() || RECURRENCE_MARKERS.matcher(norm).find()) {
            signals.add("RECURRENCE");
            score += 10;
        }
        if (FUZZY_TIME.matcher(trimmed).find() || FUZZY_TIME.matcher(norm).find()) {
            signals.add("FUZZY_TIME");
            score += 5;
        }

        boolean isComplex = score > 0;
        return new ComplexityAnalysis(isComplex, score, signals);
    }
}

