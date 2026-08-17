package nhk.quickadd;

import java.util.List;

/**
 * Result of input complexity analysis for FastPath routing decisions.
 */
public record ComplexityAnalysis(
        boolean isComplex,
        int complexityScore,
        List<String> detectedSignals
) {
    public ComplexityAnalysis {
        detectedSignals = detectedSignals != null ? List.copyOf(detectedSignals) : List.of();
    }
}
