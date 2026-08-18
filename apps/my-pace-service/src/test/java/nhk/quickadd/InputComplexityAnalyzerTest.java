package nhk.quickadd;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class InputComplexityAnalyzerTest {

    private InputComplexityAnalyzer analyzer;

    @BeforeEach
    void setUp() {
        analyzer = new InputComplexityAnalyzer();
    }

    @Test
    @DisplayName("Simple unambiguous phrase has complexity score 0")
    void testSimplePhrase() {
        ComplexityAnalysis result = analyzer.analyze("Mua sữa tươi");
        assertThat(result.isComplex()).isFalse();
        assertThat(result.complexityScore()).isEqualTo(0);
        assertThat(result.detectedSignals()).isEmpty();
    }

    @Test
    @DisplayName("Clean deadline phrase has complexity score 0")
    void testCleanDeadline() {
        ComplexityAnalysis result = analyzer.analyze("Nộp báo cáo trước 17h");
        assertThat(result.isComplex()).isFalse();
    }

    @Test
    @DisplayName("Conditional phrase triggers CONDITIONAL complexity signal")
    void testConditionalPhrase() {
        ComplexityAnalysis result = analyzer.analyze("Nếu trời mưa thì hoãn đá bóng chuyển sang mai");
        assertThat(result.isComplex()).isTrue();
        assertThat(result.detectedSignals()).contains("CONDITIONAL", "SEQUENTIAL_CONNECTOR");
    }

    @Test
    @DisplayName("Sequential transition triggers SEQUENTIAL_CONNECTOR signal")
    void testSequentialTransition() {
        ComplexityAnalysis result = analyzer.analyze("Làm báo cáo xong thì chuyển sang họp team");
        assertThat(result.isComplex()).isTrue();
        assertThat(result.detectedSignals()).contains("SEQUENTIAL_CONNECTOR");
    }

    @Test
    @DisplayName("Negation and correction trigger NEGATION_OR_CORRECTION signal")
    void testNegationAndCorrection() {
        ComplexityAnalysis result = analyzer.analyze("À không, không cần nộp báo cáo nữa");
        assertThat(result.isComplex()).isTrue();
        assertThat(result.detectedSignals()).contains("NEGATION_OR_CORRECTION");
    }

    @Test
    @DisplayName("Fuzzy time triggers FUZZY_TIME signal")
    void testFuzzyTime() {
        ComplexityAnalysis result = analyzer.analyze("Họp khoảng tầm 3h chiều");
        assertThat(result.isComplex()).isTrue();
        assertThat(result.detectedSignals()).contains("FUZZY_TIME");
    }

    @Test
    @DisplayName("Recurrence triggers RECURRENCE signal")
    void testRecurrence() {
        ComplexityAnalysis result = analyzer.analyze("Họp standup định kỳ hàng tháng");
        assertThat(result.isComplex()).isTrue();
        assertThat(result.detectedSignals()).contains("RECURRENCE");
    }
}
