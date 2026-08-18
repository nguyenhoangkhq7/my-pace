package nhk.quickadd;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import nhk.quickadd.lexicon.LexiconManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression evaluation test against golden benchmark cases in quickadd-evaluation.json.
 * Validates that pipeline refactorings and model changes do not regress Eisenhower classification or intent resolution.
 */
class QuickAddRegressionEvaluationTest {

    private EisenhowerSignalExtractor signalExtractor;
    private EisenhowerScorer scorer;
    private EisenhowerClassifier classifier;
    private IntentClassifier intentClassifier;
    private ZonedDateTime now;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        LexiconManager lexiconManager = new LexiconManager();
        signalExtractor = new EisenhowerSignalExtractor(lexiconManager);
        scorer = new EisenhowerScorer();
        classifier = new EisenhowerClassifier(signalExtractor, scorer);
        intentClassifier = new IntentClassifier();
        now = ZonedDateTime.of(2026, 8, 17, 12, 0, 0, 0, ZoneId.of("Asia/Ho_Chi_Minh"));
    }

    @Test
    @DisplayName("Evaluate golden benchmark dataset from quickadd-evaluation.json")
    void evaluateGoldenDataset() throws Exception {
        ClassPathResource resource = new ClassPathResource("quickadd-evaluation.json");
        assertThat(resource.exists()).isTrue();

        List<Map<String, String>> testCases;
        try (InputStream is = resource.getInputStream()) {
            testCases = objectMapper.readValue(is, new TypeReference<>() {});
        }

        assertThat(testCases).isNotEmpty();

        int passed = 0;
        for (Map<String, String> tc : testCases) {
            String input = tc.get("input");
            String expectedQuadrant = tc.get("expectedQuadrant");
            String expectedIntent = tc.get("expectedIntent");

            LocalDateTime dueDate = null;
            if (input.contains("mai") || input.contains("ngày mốt") || input.contains("thứ 6") || input.contains("tối mai")) {
                dueDate = now.toLocalDateTime().plusDays(1);
            } else if (input.contains("ngay") || input.contains("hôm nay") || input.contains("tối nay") || input.contains("bây giờ")) {
                dueDate = now.toLocalDateTime();
            }

            // 1. Evaluate Eisenhower
            ClassificationResult result = classifier.evaluate(input, null, dueDate, now, null, null);
            assertThat(result.quadrant())
                    .as("Failed Eisenhower quadrant for input: '%s' (reason: %s)", input, result.reason())
                    .isEqualTo(expectedQuadrant);

            // DecisionTrace check
            assertThat(result.trace()).isNotNull();
            assertThat(result.trace().signals()).isNotNull();

            // 2. Evaluate Intent
            AiExtraction mockExtraction = new AiExtraction(
                    null, null, input, null, null, null, null, null, null, null, false, null, null, null
            );
            String actualIntent = intentClassifier.classify(mockExtraction, null, input);
            assertThat(actualIntent)
                    .as("Failed Intent classification for input: '%s'", input)
                    .isEqualTo(expectedIntent);

            passed++;
        }

        assertThat(passed).isEqualTo(testCases.size());
    }
}
