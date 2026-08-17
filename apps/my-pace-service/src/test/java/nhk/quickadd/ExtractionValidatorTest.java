package nhk.quickadd;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ExtractionValidatorTest {

    private ExtractionSchemaValidator schemaValidator;
    private ExtractionSemanticValidator semanticValidator;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        schemaValidator = new ExtractionSchemaValidator();
        semanticValidator = new ExtractionSemanticValidator();
    }

    @Test
    @DisplayName("Schema: Valid JSON is parsed and normalized correctly")
    void testValidSchema() throws Exception {
        String json = """
                {
                    "title": "  Nộp báo cáo đồ án  ",
                    "intent": "DEADLINE",
                    "dateExpression": "thứ 6",
                    "timeExpression": "17h",
                    "durationExpression": "1 tiếng",
                    "checklists": ["Phần mở đầu", "Phần kết luận"],
                    "isAllDay": false,
                    "i": 0.95,
                    "u": 0.85
                }
                """;

        AiExtraction result = schemaValidator.validate(objectMapper.readTree(json));
        assertThat(result.title()).isEqualTo("Nộp báo cáo đồ án");
        assertThat(result.intent()).isEqualTo("deadline");
        assertThat(result.checklists()).containsExactly("Phần mở đầu", "Phần kết luận");
        assertThat(result.i()).isEqualTo(0.95);
        assertThat(result.u()).isEqualTo(0.85);
    }

    @Test
    @DisplayName("Schema: Missing title throws QuickAddParseException")
    void testMissingTitleThrowsException() throws Exception {
        String json = """
                {
                    "intent": "open_task",
                    "dateExpression": "mai"
                }
                """;

        assertThatThrownBy(() -> schemaValidator.validate(objectMapper.readTree(json)))
                .isInstanceOf(QuickAddParseException.class)
                .hasMessageContaining("title");
    }

    @Test
    @DisplayName("Schema: Score clamping ensures [0.0, 1.0] range")
    void testScoreClamping() throws Exception {
        String json = """
                {
                    "title": "Test Task",
                    "i": 1.5,
                    "u": -0.5
                }
                """;

        AiExtraction result = schemaValidator.validate(objectMapper.readTree(json));
        assertThat(result.i()).isEqualTo(1.0);
        assertThat(result.u()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("Semantic: Invalid duration expression like 'abc123' is cleaned to null")
    void testInvalidDurationCleaned() {
        AiExtraction extraction = new AiExtraction(
                null, "open_task", "Test", null, null, "abc123nonsense", null, null, null, null, false, null, null, null
        );

        AiExtraction validated = semanticValidator.validate(extraction, "test input");
        assertThat(validated.durationExpression()).isNull();
    }

    @Test
    @DisplayName("Semantic: Valid Vietnamese duration expression is preserved")
    void testValidDurationPreserved() {
        AiExtraction extraction = new AiExtraction(
                null, "open_task", "Test", null, null, "2 tiếng rưỡi", null, null, null, null, false, null, null, null
        );

        AiExtraction validated = semanticValidator.validate(extraction, "test input");
        assertThat(validated.durationExpression()).isEqualTo("2 tiếng rưỡi");
    }

    @Test
    @DisplayName("Semantic: Invalid recurrence expression like 'UNKNOWN_VALUE' is cleaned to null")
    void testInvalidRecurrenceCleaned() {
        AiExtraction extraction = new AiExtraction(
                null, "open_task", "Test", null, null, null, null, null, null, null, false, "UNKNOWN_VALUE", null, null
        );

        AiExtraction validated = semanticValidator.validate(extraction, "test input");
        assertThat(validated.recurrenceExpression()).isNull();
    }

    @Test
    @DisplayName("Semantic: Valid recurrence is preserved")
    void testValidRecurrencePreserved() {
        AiExtraction extraction = new AiExtraction(
                null, "time_block", "Test", null, null, null, null, null, null, null, false, "hàng tuần thứ 2", null, null
        );

        AiExtraction validated = semanticValidator.validate(extraction, "test input");
        assertThat(validated.recurrenceExpression()).isEqualTo("hàng tuần thứ 2");
    }
}
