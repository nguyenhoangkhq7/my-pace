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
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Conditional expressions
    private static final Pattern CONDITIONALS = Pattern.compile(
            "\\b(?:neu|nếu|khi nao|khi nào|trong truong hop|trong trường hợp|tuy thuoc|tùy thuộc|if|unless)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Negations, corrections & contrast markers
    private static final Pattern NEGATIONS_AND_CORRECTIONS = Pattern.compile(
            "\\b(?:khong|không|dung|đừng|chua|chưa|a khong|à không|nhung|nhưng|tuy nhien|tuy nhiên|not|don't)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Recurrence markers (complex temporal rule requiring semantic parsing)
    private static final Pattern RECURRENCE_MARKERS = Pattern.compile(
            "\\b(?:hang|hàng|moi|mỗi|lap lai|lặp lại|dinh ky|định kỳ|every|weekly|daily|monthly)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Fuzzy or ambiguous time expressions
    private static final Pattern FUZZY_TIME = Pattern.compile(
            "\\b(?:khoang|khoảng|tam|tầm|chung|chừng|co|cỡ|chac|chắc|co le|có lẽ|around|approx|maybe)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Complex clause separators (except clean multi-line checklist colons handled specifically)
    private static final Pattern CLAUSE_PUNCTUATION = Pattern.compile("[,;]");

    public ComplexityAnalysis analyze(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return new ComplexityAnalysis(false, 0, List.of());
        }

        String trimmed = rawText.trim();
        List<String> signals = new ArrayList<>();
        int score = 0;

        if (SEQUENTIAL_CONNECTORS.matcher(trimmed).find()) {
            signals.add("SEQUENTIAL_CONNECTOR");
            score += 10;
        }
        if (CONDITIONALS.matcher(trimmed).find()) {
            signals.add("CONDITIONAL");
            score += 15;
        }
        if (NEGATIONS_AND_CORRECTIONS.matcher(trimmed).find()) {
            signals.add("NEGATION_OR_CORRECTION");
            score += 10;
        }
        if (RECURRENCE_MARKERS.matcher(trimmed).find()) {
            signals.add("RECURRENCE");
            score += 10;
        }
        if (FUZZY_TIME.matcher(trimmed).find()) {
            signals.add("FUZZY_TIME");
            score += 5;
        }

        // Check for comma/semicolon when not in a simple multi-line block
        if (!trimmed.contains("\n") && CLAUSE_PUNCTUATION.matcher(trimmed).find()) {
            signals.add("MULTI_CLAUSE_PUNCTUATION");
            score += 5;
        }

        boolean isComplex = score > 0;
        return new ComplexityAnalysis(isComplex, score, signals);
    }
}
