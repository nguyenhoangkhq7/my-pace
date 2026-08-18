package nhk.quickadd;

import nhk.quickadd.lexicon.LexiconManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class EisenhowerClassifierTest {

    private EisenhowerClassifier classifier;
    private LexiconManager lexiconManager;
    private ZonedDateTime now;

    @BeforeEach
    void setUp() {
        lexiconManager = new LexiconManager();
        classifier = new EisenhowerClassifier(lexiconManager);
        now = ZonedDateTime.of(2026, 8, 17, 12, 0, 0, 0, ZoneId.of("Asia/Ho_Chi_Minh"));
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
        mai phải nộp báo cáo tài chính cho sếp trước 5 giờ | Q1
        học IELTS 30 phút mỗi tối | Q2
        sếp nhờ in tài liệu gấp cho cuộc họp nhưng tài liệu không quan trọng | Q3
        tối nay chơi game | Q4
        watch a Docker tutorial for tomorrow's project | Q1
        watch a Docker tutorial | Q2
        khong gap | Q4
        không quan trọng | Q4
        không cần nộp | Q4
        not urgent | Q4
        pay electricity bill today | Q1
        thanh toan hoa don ngay | Q1
        fix bug tren production gap | Q1
        di kham bac si ngay lap tuc | Q1
        chuẩn bị cuộc họp ngày mai | Q1
        lập kế hoạch tài chính năm sau | Q2
        phát triển bản thân | Q2
        đi siêu thị mua đồ ăn ngay bây giờ | Q3
        trả lời email không quan trọng gấp | Q3
        lướt mạng xã hội giết thời gian | Q4
        doomscrolling on tiktok | Q4
        nghiên cứu khoa học | Q2
        nộp hồ sơ visa ngày mốt | Q1
        ôn thi đại học | Q2
        ôn thi đại học tuần sau | Q1
        tập thể dục mỗi ngày | Q2
        tập thể dục | Q2
        không khẩn cấp | Q4
        từ từ làm | Q4
        mua bim bim gấp | Q3
        lướt web cho vui | Q4
        hóng chuyện tin đồn | Q4
        đi nhậu tối nay | Q4
        gossip with friends | Q4
        review cv ứng viên hôm nay | Q1
        review cv ứng viên | Q2
        khi nào rảnh thì làm | Q4
        just for fun | Q4
        chưa cần nộp báo cáo | Q4
        họp khách hàng gấp | Q1
    """)
    void testVariousPhrases(String rawText, String expectedQuadrant) {
        LocalDateTime dueDate = null;
        if (rawText.contains("mai") || rawText.contains("tomorrow") || rawText.contains("tuần sau") || rawText.contains("ngày mốt")) {
            dueDate = now.toLocalDateTime().plusDays(1);
        } else if (rawText.contains("nay") || rawText.contains("ngay") || rawText.contains("gấp") || rawText.contains("today")) {
            dueDate = now.toLocalDateTime();
        }

        PreClassificationState preState = classifier.preEvaluate(rawText, null, now);
        ClassificationResult result = classifier.postEvaluate(preState, null, null, dueDate, now);
        assertEquals(expectedQuadrant, result.quadrant(), "Failed for text: " + rawText + " Reason: " + result.reason());
    }
    
    @Test
    void testGoalAlignmentAlwaysImportant() {
        // "chơi game" is usually Q4
        PreClassificationState preState1 = classifier.preEvaluate("chơi game", null, now);
        ClassificationResult result1 = classifier.postEvaluate(preState1, null, null, null, now);
        assertEquals("Q4", result1.quadrant());
        
        // But with a goal, it becomes Important (Q2)
        nhk.goal.Goal mockGoal = new nhk.goal.Goal();
        mockGoal.setTitle("chơi game");
        PreClassificationState preState2 = classifier.preEvaluate("chơi game", java.util.List.of(mockGoal), now);
        ClassificationResult result2 = classifier.postEvaluate(preState2, null, null, null, now);
        assertEquals("Q2", result2.quadrant());
    }
    
    @Test
    void testOverdueAlwaysUrgent() {
        LocalDateTime past = now.toLocalDateTime().minusDays(1);
        PreClassificationState preState = classifier.preEvaluate("làm việc linh tinh", null, now);
        ClassificationResult result = classifier.postEvaluate(preState, null, null, past, now);
        assertTrue(result.isUrgent());
        assertEquals("Q3", result.quadrant()); // Not important, but urgent
    }

    @Test
    void testNegationMasksKeyword() {
        PreClassificationState preStatePos = classifier.preEvaluate("quan trọng", null, now);
        ClassificationResult pos = classifier.postEvaluate(preStatePos, null, null, null, now);
        // "quan trọng" isn't explicitly in lexicon but maybe covered by other rules. Let's test "quan trọng" negation
        
        PreClassificationState preStateNeg = classifier.preEvaluate("không quan trọng", null, now);
        ClassificationResult neg = classifier.postEvaluate(preStateNeg, null, null, null, now);
        assertFalse(neg.isImportant());
        assertEquals("Q4", neg.quadrant());
    }

    @Test
    void testMixedLanguage() {
        PreClassificationState preState = classifier.preEvaluate("fix lỗi trên production ASAP", null, now);
        ClassificationResult result = classifier.postEvaluate(preState, null, null, now.toLocalDateTime(), now);
        assertTrue(result.isUrgent());
        assertTrue(result.isImportant());
        assertEquals("Q1", result.quadrant());
    }
}
