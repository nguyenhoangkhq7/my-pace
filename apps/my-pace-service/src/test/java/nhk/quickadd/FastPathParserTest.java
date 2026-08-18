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
    @DisplayName("Task with deadline containing date & time: Nộp bài trước 17h chiều mai")
    void testTaskWithDeadlineDateAndTime() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Nộp bài trước 17h chiều mai");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("deadline");
        assertThat(result.get().title()).isEqualTo("Nộp bài");
        assertThat(result.get().timeExpression()).isEqualTo("17h chiều");
        assertThat(result.get().dateExpression()).isEqualTo("mai");
    }

    @Test
    @DisplayName("Task with deadline keyword 'Hạn chót thứ 6'")
    void testTaskWithDeadlineKeyword() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Nộp đồ án hạn chót thứ 6");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("deadline");
        assertThat(result.get().title()).isEqualTo("Nộp đồ án");
        assertThat(result.get().dateExpression()).isEqualTo("thứ 6");
    }

    @Test
    @DisplayName("Clean meeting range: Họp team 9h - 10h sáng mai → time_block event")
    void testMeetingRange() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Họp team 9h - 10h sáng mai");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Họp team");
        assertThat(result.get().dateExpression()).isEqualTo("mai");
        assertThat(result.get().timeExpression()).contains("9h - 10h sáng");
    }

    @Test
    @DisplayName("Event with start time: Khám răng lúc 8h sáng mai")
    void testEventWithStartTime() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Khám răng lúc 8h sáng mai");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Khám răng");
        assertThat(result.get().timeExpression()).isEqualTo("8h sáng");
        assertThat(result.get().dateExpression()).isEqualTo("mai");
    }

    @Test
    @DisplayName("Task with duration: Đọc sách 30 phút")
    void testTaskWithDuration() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Đọc sách 30 phút");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Đọc sách");
        assertThat(result.get().durationExpression()).isEqualTo("30 phút");
    }

    @Test
    @DisplayName("Task with duration shortcut: Review PR 15p")
    void testTaskWithDurationShortcut() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Review PR 15p");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Review PR");
        assertThat(result.get().durationExpression()).isEqualTo("15p");
    }

    @Test
    @DisplayName("Task with relative date: Đi siêu thị sáng mai")
    void testTaskWithRelativeDate() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Đi siêu thị sáng mai");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Đi siêu thị");
        assertThat(result.get().dateExpression()).isEqualTo("sáng mai");
    }

    @Test
    @DisplayName("Task with date and urgent suffix: làm bài khóa luận tối nay gấp")
    void testTaskWithDateAndUrgentSuffix() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("làm bài khóa luận tối nay gấp");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Làm bài khóa luận");
        assertThat(result.get().dateExpression()).isEqualTo("tối nay");
        assertThat(result.get().u()).isEqualTo(0.9);
    }

    @Test
    @DisplayName("Task with duration and date: Học tiếng Anh 1 tiếng tối nay")
    void testTaskWithDurationAndDate() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Học tiếng Anh 1 tiếng tối nay");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Học tiếng Anh");
        assertThat(result.get().durationExpression()).isEqualTo("1 tiếng");
        assertThat(result.get().dateExpression()).isEqualTo("tối nay");
    }

    @Test
    @DisplayName("Inline checklist: Dọn phòng: lau bàn, dọn giường, hút bụi")
    void testInlineChecklist() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Dọn phòng: lau bàn, dọn giường, hút bụi");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Dọn phòng");
        assertThat(result.get().checklists()).containsExactly("Lau bàn", "Dọn giường", "Hút bụi");
    }

    @Test
    @DisplayName("Inline checklist with hashtag and note: Mua đồ: trứng, sữa, bánh mì #daily note: mua ở VinMart")
    void testInlineChecklistWithMetadata() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Mua đồ: trứng, sữa, bánh mì #daily note: mua ở VinMart");
        assertThat(result).isPresent();
        assertThat(result.get().title()).isEqualTo("Mua đồ");
        assertThat(result.get().categoryHint()).isEqualTo("daily");
        assertThat(result.get().notes()).isEqualTo("mua ở VinMart");
        assertThat(result.get().checklists()).containsExactly("Trứng", "Sữa", "Bánh mì");
    }

    @Test
    @DisplayName("Urgent prefix: gấp: sửa lỗi thanh toán")
    void testUrgentPrefix() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("gấp: sửa lỗi thanh toán");
        assertThat(result).isPresent();
        assertThat(result.get().title()).isEqualTo("Sửa lỗi thanh toán");
        assertThat(result.get().u()).isEqualTo(0.9);
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
    @DisplayName("Recurring event: Uống thuốc mỗi ngày lúc 8h sáng")
    void testRecurringEventDaily() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Uống thuốc mỗi ngày lúc 8h sáng");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Uống thuốc");
        assertThat(result.get().timeExpression()).isEqualTo("8h sáng");
        assertThat(result.get().recurrenceExpression()).isEqualTo("mỗi ngày");
    }

    @Test
    @DisplayName("Recurring event: Họp standup mỗi thứ 2 lúc 9h")
    void testRecurringEventWeekly() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Họp standup mỗi thứ 2 lúc 9h");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Họp standup");
        assertThat(result.get().timeExpression()).isEqualTo("9h");
        assertThat(result.get().recurrenceExpression()).isEqualTo("mỗi thứ 2");
    }

    @Test
    @DisplayName("Recurring event multiple days: Chạy bộ hàng tuần thứ 2, thứ 4, thứ 6 lúc 6h sáng")
    void testRecurringEventMultipleDays() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Chạy bộ hàng tuần thứ 2, thứ 4, thứ 6 lúc 6h sáng");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Chạy bộ");
        assertThat(result.get().timeExpression()).isEqualTo("6h sáng");
        assertThat(result.get().recurrenceExpression()).isEqualTo("hàng tuần thứ 2, thứ 4, thứ 6");
    }

    @Test
    @DisplayName("Priority shortcut !q1: Fix bug thanh toán !q1")
    void testPriorityShortcutQ1() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Fix bug thanh toán !q1");
        assertThat(result).isPresent();
        assertThat(result.get().title()).isEqualTo("Fix bug thanh toán");
        assertThat(result.get().i()).isEqualTo(0.9);
        assertThat(result.get().u()).isEqualTo(0.9);
    }

    @Test
    @DisplayName("Priority shortcut !q2: Đọc sách kinh doanh !q2")
    void testPriorityShortcutQ2() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Đọc sách kinh doanh !q2");
        assertThat(result).isPresent();
        assertThat(result.get().title()).isEqualTo("Đọc sách kinh doanh");
        assertThat(result.get().i()).isEqualTo(0.9);
        assertThat(result.get().u()).isEqualTo(0.1);
    }

    @Test
    @DisplayName("Priority shortcut !q3: Dọn email !q3")
    void testPriorityShortcutQ3() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Dọn email !q3");
        assertThat(result).isPresent();
        assertThat(result.get().title()).isEqualTo("Dọn email");
        assertThat(result.get().i()).isEqualTo(0.1);
        assertThat(result.get().u()).isEqualTo(0.9);
    }

    @Test
    @DisplayName("Priority shortcut !q4: Lướt mạng xã hội !q4")
    void testPriorityShortcutQ4() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Lướt mạng xã hội !q4");
        assertThat(result).isPresent();
        assertThat(result.get().title()).isEqualTo("Lướt mạng xã hội");
        assertThat(result.get().i()).isEqualTo(0.1);
        assertThat(result.get().u()).isEqualTo(0.1);
    }

    @Test
    @DisplayName("Task with duration and English date: Team meeting 1 hour tomorrow afternoon")
    void testTaskWithDurationAndEnglishDate() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Team meeting 1 hour tomorrow afternoon");
        assertThat(result).isPresent();
        assertThat(result.get().title()).isEqualTo("Team meeting");
        assertThat(result.get().durationExpression()).isEqualTo("1 hour");
        assertThat(result.get().dateExpression()).isEqualTo("tomorrow afternoon");
    }

    @Test
    @DisplayName("Task with duration in middle: Đi bách hóa xanh 1 tiếng mua rau")
    void testTaskWithDurationInMiddle() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Đi bách hóa xanh 1 tiếng mua rau");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Đi bách hóa xanh mua rau");
        assertThat(result.get().durationExpression()).isEqualTo("1 tiếng");
        assertThat(result.get().dateExpression()).isNull();
    }

    @Test
    @DisplayName("Task with duration in middle and date at end: Đi bách hóa xanh 1 tiếng mua rau tối nay")
    void testTaskWithDurationInMiddleAndDateAtEnd() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Đi bách hóa xanh 1 tiếng mua rau tối nay");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Đi bách hóa xanh mua rau");
        assertThat(result.get().durationExpression()).isEqualTo("1 tiếng");
        assertThat(result.get().dateExpression()).isEqualTo("tối nay");
    }

    @Test
    @DisplayName("Task with date at start and duration in middle: Tối nay đi bách hóa xanh 1 tiếng mua rau")
    void testTaskWithDateAtStartAndDurationInMiddle() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Tối nay đi bách hóa xanh 1 tiếng mua rau");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Đi bách hóa xanh mua rau");
        assertThat(result.get().dateExpression()).isEqualTo("Tối nay");
        assertThat(result.get().durationExpression()).isEqualTo("1 tiếng");
    }

    @Test
    @DisplayName("Task with date in middle: Đi bách hóa xanh tối nay mua rau")
    void testTaskWithDateInMiddle() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Đi bách hóa xanh tối nay mua rau");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Đi bách hóa xanh mua rau");
        assertThat(result.get().dateExpression()).isEqualTo("tối nay");
    }

    @Test
    @DisplayName("Task with date first: Sáng mai đi khám răng")
    void testTaskWithDateFirst() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Sáng mai đi khám răng");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Đi khám răng");
        assertThat(result.get().dateExpression()).isEqualTo("Sáng mai");
    }

    @Test
    @DisplayName("Task with duration first: 30 phút đọc sách")
    void testTaskWithDurationFirst() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("30 phút đọc sách");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("open_task");
        assertThat(result.get().title()).isEqualTo("Đọc sách");
        assertThat(result.get().durationExpression()).isEqualTo("30 phút");
    }

    @Test
    @DisplayName("Event with start time: ăn sáng ở macdonal 7 giờ sáng mai")
    void testEventWithStartTime_AnSangMacdonald() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("ăn sáng ở macdonal 7 giờ sáng mai");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Ăn sáng ở macdonal");
        assertThat(result.get().timeExpression()).isEqualTo("7 giờ sáng");
        assertThat(result.get().dateExpression()).isEqualTo("mai");
    }

    @Test
    @DisplayName("Event with date first: Sáng mai 7 giờ ăn sáng ở macdonal")
    void testEventWithDateFirst_AnSangMacdonald() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Sáng mai 7 giờ ăn sáng ở macdonal");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Ăn sáng ở macdonal");
        assertThat(result.get().timeExpression()).isEqualTo("7 giờ");
        assertThat(result.get().dateExpression()).isEqualTo("Sáng mai");
    }

    @Test
    @DisplayName("Event with time first: 7 giờ sáng mai ăn sáng ở macdonal")
    void testEventWithTimeFirst_AnSangMacdonald() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("7 giờ sáng mai ăn sáng ở macdonal");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Ăn sáng ở macdonal");
        assertThat(result.get().timeExpression()).isEqualTo("7 giờ sáng");
        assertThat(result.get().dateExpression()).isEqualTo("mai");
    }

    @Test
    @DisplayName("4-tuple: về quê 3 giờ chiều mai 4 tiếng")
    void testFourTuple_VeQue3hChieuMai4Tieng() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("về quê 3 giờ chiều mai 4 tiếng");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Về quê");
        assertThat(result.get().timeExpression()).isEqualTo("3 giờ chiều");
        assertThat(result.get().dateExpression()).isEqualTo("mai");
        assertThat(result.get().durationExpression()).isEqualTo("4 tiếng");
    }

    @Test
    @DisplayName("4-tuple with date first: Chiều mai 3h về quê 4 tiếng")
    void testFourTuple_ChieuMai3hVeQue4Tieng() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Chiều mai 3h về quê 4 tiếng");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Về quê");
        assertThat(result.get().timeExpression()).isEqualTo("3h");
        assertThat(result.get().dateExpression()).isEqualTo("Chiều mai");
        assertThat(result.get().durationExpression()).isEqualTo("4 tiếng");
    }

    @Test
    @DisplayName("Recurring event: Gọi cho mẹ vào tối thứ 2 hàng tuần")
    void testRecurringEvent_GoiChoMeToiThu2HangTuan() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Gọi cho mẹ vào tối thứ 2 hàng tuần");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Gọi cho mẹ");
        assertThat(result.get().recurrenceExpression()).isEqualTo("vào tối thứ 2 hàng tuần");
    }

    @Test
    @DisplayName("Residual token guardrail: isTitleClean returns true for normal titles and false for titles with leaked temporal tokens")
    void testIsTitleClean_Guardrail() {
        assertThat(fastPathParser.isTitleClean("Học tiếng Anh")).isTrue();
        assertThat(fastPathParser.isTitleClean("Học tiếng Nhật")).isTrue();
        assertThat(fastPathParser.isTitleClean("Ăn sáng ở Macdonald")).isTrue();
        assertThat(fastPathParser.isTitleClean("Ăn tối cùng gia đình")).isTrue();
        assertThat(fastPathParser.isTitleClean("Đi bách hóa xanh mua rau")).isTrue();

        assertThat(fastPathParser.isTitleClean("Về quê 3 giờ")).isFalse();
        assertThat(fastPathParser.isTitleClean("Đi siêu thị 1 tiếng")).isFalse();
        assertThat(fastPathParser.isTitleClean("Gọi cho mẹ hàng tuần")).isFalse();
        assertThat(fastPathParser.isTitleClean("Nộp báo cáo trước 17h")).isFalse();
        assertThat(fastPathParser.isTitleClean("Họp team sáng mai")).isFalse();
    }

    @Test
    @DisplayName("Recurring event with time and action: Mỗi tối thứ 3 lúc 7 giờ chạy bộ")
    void testRecurringEvent_MoiToiThu3Luc7GioChayBo() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Mỗi tối thứ 3 lúc 7 giờ chạy bộ");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Chạy bộ");
        assertThat(result.get().recurrenceExpression()).isEqualTo("Mỗi tối thứ 3");
        assertThat(result.get().timeExpression()).isEqualTo("7 giờ");
    }

    @Test
    @DisplayName("Recurring standalone: Mỗi tối thứ 3 lúc 7 giờ")
    void testRecurringEvent_MoiToiThu3Luc7GioStandalone() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Mỗi tối thứ 3 lúc 7 giờ");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().recurrenceExpression()).isEqualTo("Mỗi tối thứ 3");
        assertThat(result.get().timeExpression()).isEqualTo("7 giờ");
    }

    @Test
    @DisplayName("Recurring with digit sequence 2 4 6, time and duration: Mỗi 2 4 6 lúc 18h đá bóng 2 tiếng")
    void testRecurringEvent_Moi246Luc18hDaBong2Tieng() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Mỗi 2 4 6 lúc 18h đá bóng 2 tiếng");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Đá bóng");
        assertThat(result.get().recurrenceExpression()).isEqualTo("Mỗi 2 4 6");
        assertThat(result.get().timeExpression()).isEqualTo("18h");
        assertThat(result.get().durationExpression()).isEqualTo("2 tiếng");
    }

    @Test
    @DisplayName("Recurring event suffix: Chạy bộ mỗi 2 4 6")
    void testRecurringEvent_ChayBoMoi246() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Chạy bộ mỗi 2 4 6");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Chạy bộ");
        assertThat(result.get().recurrenceExpression()).isEqualTo("mỗi 2 4 6");
    }

    @Test
    @DisplayName("Recurring event with 3 5 7: Tập gym mỗi 3 5 7 lúc 6h sáng")
    void testRecurringEvent_TapGymMoi357Luc6hSang() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Tập gym mỗi 3 5 7 lúc 6h sáng");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Tập gym");
        assertThat(result.get().recurrenceExpression()).isEqualTo("mỗi 3 5 7");
        assertThat(result.get().timeExpression()).isEqualTo("6h sáng");
    }

    @Test
    @DisplayName("Recurring event with range: Mỗi thứ 2 đến thứ 6 lúc 8h họp standup")
    void testRecurringEvent_MoiThu2DenThu6Luc8hHopStandup() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Mỗi thứ 2 đến thứ 6 lúc 8h họp standup");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Họp standup");
        assertThat(result.get().recurrenceExpression()).isEqualTo("Mỗi thứ 2 đến thứ 6");
        assertThat(result.get().timeExpression()).isEqualTo("8h");
    }

    @Test
    @DisplayName("Recurring event with weekend: Tập yoga mỗi cuối tuần lúc 7h sáng")
    void testRecurringEvent_TapYogaMoiCuoiTuanLuc7hSang() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Tập yoga mỗi cuối tuần lúc 7h sáng");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Tập yoga");
        assertThat(result.get().recurrenceExpression()).isEqualTo("mỗi cuối tuần");
        assertThat(result.get().timeExpression()).isEqualTo("7h sáng");
    }

    @Test
    @DisplayName("Recurring event with evening period: Xem phim mỗi tối thứ 6")
    void testRecurringEvent_XemPhimMoiToiThu6() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Xem phim mỗi tối thứ 6");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Xem phim");
        assertThat(result.get().recurrenceExpression()).isEqualTo("mỗi tối thứ 6");
    }

    @Test
    @DisplayName("Complex query with condition/negation: Bypasses fast path to LLM")
    void testComplexQuery_BypassesFastPath() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Nếu trời mưa thì hoãn đá bóng chuyển sang mai");
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Event with time range: Đánh cầu 1-3 giờ chiều")
    void testEventRange_DanhCau1Den3GioChieu() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Đánh cầu 1-3 giờ chiều");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Đánh cầu");
        assertThat(result.get().timeExpression()).isEqualTo("1-3 giờ chiều");
        assertThat(result.get().dateExpression()).isNull();
    }

    @Test
    @DisplayName("Event with time range and date: Đá bóng 15h-17h chiều mai")
    void testEventRange_DaBong15h17hChieuMai() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Đá bóng 15h-17h chiều mai");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Đá bóng");
        assertThat(result.get().timeExpression()).isEqualTo("15h-17h chiều");
        assertThat(result.get().dateExpression()).isEqualTo("mai");
    }

    @Test
    @DisplayName("Event with date first and time range: Sáng mai 9h-11h họp team")
    void testEventRange_SangMai9h11hHopTeam() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Sáng mai 9h-11h họp team");
        assertThat(result).isPresent();
        assertThat(result.get().intent()).isEqualTo("time_block");
        assertThat(result.get().title()).isEqualTo("Họp team");
        assertThat(result.get().timeExpression()).isEqualTo("9h-11h");
        assertThat(result.get().dateExpression()).isEqualTo("Sáng mai");
    }

    @Test
    @DisplayName("Hashtag with underscores and priority: #Project_cá_nhân !q1")
    void testHashtagWithUnderscores() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Làm báo cáo 2 tiếng chiều mai #Project_cá_nhân !q1");
        assertThat(result).isPresent();
        assertThat(result.get().categoryHint()).isEqualTo("Project_cá_nhân");
        assertThat(result.get().title()).isEqualTo("Làm báo cáo");
        assertThat(result.get().i()).isEqualTo(0.9);
        assertThat(result.get().u()).isEqualTo(0.9);
    }

    @Test
    @DisplayName("At goal mention with underscores: @KLTN_2026 #Học_tập !q2")
    void testGoalMentionWithUnderscores() {
        Optional<AiExtraction> result = fastPathParser.tryFastParse("Nộp báo cáo trước thứ 6 @KLTN_2026 #Học_tập !q2");
        assertThat(result).isPresent();
        assertThat(result.get().goalHint()).isEqualTo("KLTN_2026");
        assertThat(result.get().categoryHint()).isEqualTo("Học_tập");
        assertThat(result.get().title()).isEqualTo("Nộp báo cáo");
        assertThat(result.get().i()).isEqualTo(0.9);
        assertThat(result.get().u()).isEqualTo(0.1);
    }
}

