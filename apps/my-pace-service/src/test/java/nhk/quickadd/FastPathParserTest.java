package nhk.quickadd;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class FastPathParserTest {

    private FastPathParser fastPathParser;

    @BeforeEach
    void setUp() {
        fastPathParser = new FastPathParser();
    }

    @Test
    @DisplayName("Simple open task: Mua sữa tươi → open_task with title 'Mua sữa tươi'")
    void testSimpleOpenTask() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("mua sữa tươi");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Mua sữa tươi");
        assertThat(result.get().dateExpression()).isNull();
        assertThat(result.get().timeExpression()).isNull();
    }

    @Test
    @DisplayName("Simple action task: Đi siêu thị → open_task with title 'Đi siêu thị'")
    void testSimpleActionTask() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Đi siêu thị");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Đi siêu thị");
    }

    @Test
    @DisplayName("Task with clean deadline: Nộp báo cáo trước 17h → deadline task")
    void testTaskWithCleanDeadline() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Nộp báo cáo trước 17h");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("deadline");
        assertThat(result.get().title()).isEqualTo("Nộp báo cáo");
        assertThat(result.get().timeExpression()).isEqualTo("17h");
    }

    @Test
    @DisplayName("Clean meeting range: Họp team 9h - 10h sáng mai → time_block event")
    void testMeetingRange() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Họp team 9h - 10h sáng mai");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Họp team");
        assertThat(result.get().dateExpression()).isEqualTo("mai");
        assertThat(result.get().timeExpression()).contains("9h - 10h");
    }

    @Test
    @DisplayName("Multi-line checklist: Đi siêu thị:\\n- Mua sữa\\n- Mua trứng")
    void testMultiLineChecklist() {
        String input = "Đi siêu thị:\n- Mua sữa\n- Mua trứng";
        Optional<AiExtraction> result = fastPathParser.tryFastParse(input);
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Đi siêu thị");
        assertThat(result.get().checklists()).containsExactly("Mua sữa", "Mua trứng");
    }

    @Test
    @DisplayName("Complex query with condition/negation: Bypasses fast path to LLM")
    void testComplexQuery_BypassesFastPath() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Nếu trời mưa thì hoãn đá bóng chuyển sang mai");
        assertThat(result).isEmpty();
    }
}
