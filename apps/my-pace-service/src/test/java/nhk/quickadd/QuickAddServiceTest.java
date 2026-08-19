package nhk.quickadd;

import nhk.category.Category;
import nhk.category.CategoryRepository;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class QuickAddServiceTest {

    @Mock private CategoryRepository categoryRepository;
    @Mock private GoalRepository     goalRepository;
    @Mock private RestClient         restClient;
    @Mock private RestClient.RequestBodyUriSpec  requestBodyUriSpec;
    @Mock private RestClient.RequestBodySpec     requestBodySpec;
    @Mock private RestClient.ResponseSpec        responseSpec;

    private QuickAddService quickAddService;

    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        quickAddService = new QuickAddService(
                categoryRepository, goalRepository, new EisenhowerClassifier(new nhk.quickadd.lexicon.LexiconManager()), "test-key", "test-model", restClient);
    }

    // ── Task parsing ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("open_task without date → type=task, dueDate=null")
    void parseOpenTask_NoDate_ReturnTaskWithNullDueDate() {
        mockGroqResponse(json("open_task", "Mua sữa", null, null, null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("mua sữa"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Mua sữa");
        assertThat(r.dueDate()).isNull();
        assertThat(r.eventDate()).isNull();
        assertThat(r.startTime()).isNull();
        assertThat(r.endTime()).isNull();
        assertThat(r.checklists()).isNull();
        assertThat(r.isAllDay()).isFalse();
        assertThat(r.recurrenceType()).isEqualTo("NONE");
    }

    @Test
    @DisplayName("deadline task with dateExpression → type=task, dueDate resolved at 23:59")
    void parseDeadlineTask_WithDate_ReturnTaskWithDueDate() {
        mockGroqResponse(json("deadline", "Nộp báo cáo", "thứ 6", null, null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("nộp báo cáo thứ 6"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.dueDate()).isNotNull().endsWith("T23:59:00");
        assertThat(r.startTime()).isNull();
        assertThat(r.recurrenceType()).isEqualTo("NONE");
    }

    @Test
    @DisplayName("deadline task with dateExpression and timeExpression → type=task, dueDate resolved with exact time")
    void parseDeadlineTask_WithDateAndTime_ReturnTaskWithExactDueDate() {
        mockGroqResponse(json("deadline", "Nộp báo cáo", "mai", "5h chiều", null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("nộp báo cáo trước 5h chiều mai"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.dueDate()).isNotNull().endsWith("T17:00:00");
        assertThat(r.startTime()).isNull();
        assertThat(r.endTime()).isNull();
        assertThat(r.recurrenceType()).isEqualTo("NONE");
    }

    @Test
    @DisplayName("deadline task with 'ngày mốt' / 'hôm mốt' → resolves to today + 2")
    void parseDeadlineTask_WithNgayMot_ResolvesDayAfterTomorrow() {
        mockGroqResponse(json("deadline", "Nộp báo cáo", "ngày mốt", null, null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("ngày mốt nộp báo cáo"), USER_ID, "Asia/Ho_Chi_Minh");
        String expectedDate = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(2).toString();

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.dueDate()).isNotNull().startsWith(expectedDate);
    }

    @Test
    @DisplayName("open_task with checklist items → checklists populated correctly")
    void parseChecklistTask_ReturnsChecklists() {
        mockGroqResponse("""
                {"intent":"open_task","title":"Đi siêu thị","dateExpression":null,"timeExpression":null,
                 "durationExpression":null,"categoryHint":null,"goalHint":null,"notes":null,
                 "checklists":["Mua sữa","Mua trứng","Mua rau cải"],"isAllDay":false,"recurrenceExpression":null}""");
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("Đi siêu thị mua sữa, trứng, rau cải"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.checklists()).isNotNull().hasSize(3);
        assertThat(r.checklists().get(0).title()).isEqualTo("Mua sữa");
        assertThat(r.checklists().get(2).title()).isEqualTo("Mua rau cải");
    }

    // ── Event parsing ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("time_block → type=event, startTime=15:00, endTime=17:00")
    void parseTimeBlock_ReturnsEventWithTimes() {
        mockGroqResponse(json("time_block", "Họp team backend", "mai", "3h", "2 tiếng", null, null, "B2", null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("Mai 3h họp team backend ở B2 khoảng 2 tiếng"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.startTime()).isEqualTo("15:00");
        assertThat(r.endTime()).isEqualTo("17:00");
        assertThat(r.estimatedMinutes()).isEqualTo(120);
        assertThat(r.notes()).isEqualTo("B2");
        assertThat(r.dueDate()).isNull();
        assertThat(r.isAllDay()).isFalse();
        assertThat(r.recurrenceType()).isEqualTo("NONE");
    }

    @Test
    @DisplayName("time_block with explicit chiều period → startTime=15:00")
    void parseTimeBlock_ExplicitChieuPeriod_CorrectHour() {
        mockGroqResponse(json("time_block", "Phỏng vấn ứng viên", "mai", "3 giờ chiều", "1 tiếng", null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("mai 3 giờ chiều phỏng vấn ứng viên 1 tiếng"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.startTime()).isEqualTo("15:00");
        assertThat(r.endTime()).isEqualTo("16:00");
    }

    @Test
    @DisplayName("time_block with English 3pm timeExpression → startTime=15:00, endTime=16:00")
    void parseTimeBlock_EnglishPM_CorrectHour() {
        mockGroqResponse(json("time_block", "team meeting", "tomorrow", "3pm", null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("team meeting at 3pm tomorrow"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.startTime()).isEqualTo("15:00");
        assertThat(r.endTime()).isEqualTo("16:00");
    }

    @Test
    @DisplayName("time_block with English 6am - 7am range → startTime=06:00, endTime=07:00")
    void parseTimeBlock_EnglishAMRange_CorrectHours() {
        mockGroqResponse(json("time_block", "run", "tomorrow", "6am - 7am", null, "health", null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("run 6am - 7am tomorrow #health"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.startTime()).isEqualTo("06:00");
        assertThat(r.endTime()).isEqualTo("07:00");
    }

    @Test
    @DisplayName("time_block with 'tối nay' in timeExpression and null dateExpression → eventDate=today")
    void parseTimeBlock_TonightInTimeExpression_ResolvesEventDateFromTimeExpression() {
        mockGroqResponse(json("time_block", "Xem phim", null, "8 giờ tối nay", "2 tiếng", null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("xem phim tốn 2 tiếng lúc 8 giờ tối nay"), USER_ID, "Asia/Ho_Chi_Minh");
        String expectedToday = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).toString();

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.eventDate()).isEqualTo(expectedToday);
        assertThat(r.startTime()).isEqualTo("20:00");
        assertThat(r.endTime()).isEqualTo("22:00");
        assertThat(r.dueDate()).isNull();
    }

    @Test
    @DisplayName("time_block with '8 giờ' in timeExpression and 'tối nay' in dateExpression → startTime=20:00, endTime=22:00")
    void parseTimeBlock_BareHourWithTonightInDateExpression_ResolvesEveningTime() {
        mockGroqResponse(json("time_block", "Xem phim", "tối nay", "8 giờ", "2 tiếng", null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("xem phim tối nay 8 giờ tốn 2 tiếng"), USER_ID, "Asia/Ho_Chi_Minh");
        String expectedToday = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).toString();

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.eventDate()).isEqualTo(expectedToday);
        assertThat(r.startTime()).isEqualTo("20:00");
        assertThat(r.endTime()).isEqualTo("22:00");
        assertThat(r.estimatedMinutes()).isEqualTo(120);
    }

    @Test
    @DisplayName("time_block with '1-3 giờ chiều' in timeExpression → startTime=13:00, endTime=15:00, not March 1st")
    void parseTimeBlock_TimeRange1To3Afternoon_NotParsedAsMarch1st() {
        mockGroqResponse(json("time_block", "Đánh cầu", null, "1-3 giờ chiều", null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("Đánh cầu 1-3 giờ chiều"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Đánh cầu");
        assertThat(r.startTime()).isEqualTo("13:00");
        assertThat(r.endTime()).isEqualTo("15:00");
        assertThat(r.estimatedMinutes()).isEqualTo(120);
        // eventDate should be today or tomorrow (not March 1st 2026-03-01)
        assertThat(r.eventDate()).isNotEqualTo("2026-03-01");
    }

    // ── All-day event ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("allDayHint=true → type=event, isAllDay=true, startTime/endTime null")
    void parseAllDayEvent_ReturnsEventWithIsAllDay() {
        mockGroqResponse(json("open_task", "Nghỉ lễ", "mai", null, null, null, null, null, null, true, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("Ngày mai nghỉ lễ cả ngày"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.isAllDay()).isTrue();
        assertThat(r.startTime()).isNull();
        assertThat(r.endTime()).isNull();
        assertThat(r.eventDate()).isNotNull();
        assertThat(r.dueDate()).isNull();
        assertThat(r.recurrenceType()).isEqualTo("NONE");
    }

    @Test
    @DisplayName("allDayHint=false, no timeExpression → type=task (not all-day event)")
    void parseNoTime_NotAllDay_IsTask() {
        mockGroqResponse(json("open_task", "Đi công viên", "mai", null, null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("ngày mai đi công viên"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.isAllDay()).isFalse();
    }

    @Test
    @DisplayName("Team meeting 1 hour tomorrow afternoon → type=event, startTime=14:00, endTime=15:00, duration=60")
    void parseTeamMeetingTomorrowAfternoon() {
        mockGroqResponse(json("open_task", "Team meeting", "tomorrow afternoon", null, "1 hour", null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("Team meeting 1 hour tomorrow afternoon"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Team meeting");
        assertThat(r.estimatedMinutes()).isEqualTo(60);
        assertThat(r.startTime()).isEqualTo("14:00");
        assertThat(r.endTime()).isEqualTo("15:00");
        assertThat(r.eventDate()).isEqualTo(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(1).toString());
    }

    // ── Recurrence ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("recurrenceExpression hàng tuần thứ 2 thứ 4 thứ 6 → WEEKLY with days [1,3,5]")
    void parseRecurringEvent_WeeklyMultipleDays() {
        mockGroqResponse(json("time_block", "Họp standup", null, "9h sáng", null, null, null, null, null, false,
                "hàng tuần thứ 2, thứ 4, thứ 6"));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("Họp standup lúc 9h sáng hàng tuần thứ 2, thứ 4, thứ 6"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.startTime()).isEqualTo("09:00");
        assertThat(r.recurrenceType()).isEqualTo("WEEKLY");
        assertThat(r.recurrenceDaysOfWeek()).containsExactly(1, 3, 5);
    }

    @Test
    @DisplayName("recurrenceExpression hàng ngày → DAILY")
    void parseRecurringEvent_Daily() {
        mockGroqResponse(json("time_block", "Tập gym", null, "7h", "1 tiếng", null, null, null, null, false, "hàng ngày"));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("tập gym 7h mỗi ngày 1 tiếng"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.recurrenceType()).isEqualTo("DAILY");
        assertThat(r.recurrenceDaysOfWeek()).isNull();
    }

    @Test
    @DisplayName("recurrenceExpression hàng tuần without days → WEEKLY, days from eventDate")
    void parseRecurringEvent_WeeklyFallbackFromDate() {
        // eventDate=mai (Wednesday) → DayOfWeek.WEDNESDAY = 3
        mockGroqResponse(json("time_block", "Tập yoga", "mai", "7h", null, null, null, null, null, false, "hàng tuần"));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("tập yoga mai 7h hàng tuần"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.recurrenceType()).isEqualTo("WEEKLY");
        assertThat(r.recurrenceDaysOfWeek()).isNotNull().hasSize(1);
    }

    @Test
    @DisplayName("recurrenceExpression mỗi tối thứ 3 lúc 7 giờ → WEEKLY with day [2] and startTime 19:00")
    void parseRecurringEvent_WeeklyMoiToiThu3() {
        mockGroqResponse(json("time_block", "Họp CLB Sách", null, "7 giờ", null, null, null, null, null, false, "mỗi tối thứ 3"));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("mỗi tối thứ 3 lúc 7 giờ họp CLB Sách"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.startTime()).isEqualTo("19:00");
        assertThat(r.recurrenceType()).isEqualTo("WEEKLY");
        assertThat(r.recurrenceDaysOfWeek()).containsExactly(2);
        assertThat(r.eventDate()).isNotNull();
    }

    @Test
    @DisplayName("recurrenceExpression mỗi 2 4 6 lúc 18h → WEEKLY with days [1, 3, 5]")
    void parseRecurringEvent_WeeklyMoi246() {
        mockGroqResponse(json("time_block", "Đá bóng", null, "18h", "2 tiếng", null, null, null, null, false, "mỗi 2 4 6"));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("mỗi 2 4 6 lúc 18h đá bóng 2 tiếng"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Đá bóng");
        assertThat(r.startTime()).isEqualTo("18:00");
        assertThat(r.endTime()).isEqualTo("20:00");
        assertThat(r.recurrenceType()).isEqualTo("WEEKLY");
        assertThat(r.recurrenceDaysOfWeek()).containsExactly(1, 3, 5);
    }

    @Test
    @DisplayName("recurrenceExpression mỗi thứ 2 đến thứ 6 lúc 8h → WEEKLY with days [1, 2, 3, 4, 5]")
    void parseRecurringEvent_WeeklyThu2DenThu6() {
        mockGroqResponse(json("time_block", "Họp standup", null, "8h", null, null, null, null, null, false, "mỗi thứ 2 đến thứ 6"));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("mỗi thứ 2 đến thứ 6 lúc 8h họp standup"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.startTime()).isEqualTo("08:00");
        assertThat(r.recurrenceType()).isEqualTo("WEEKLY");
        assertThat(r.recurrenceDaysOfWeek()).containsExactly(1, 2, 3, 4, 5);
    }

    @Test
    @DisplayName("recurrenceExpression mỗi cuối tuần → WEEKLY with days [6, 7]")
    void parseRecurringEvent_WeeklyMoiCuoiTuan() {
        mockGroqResponse(json("time_block", "Tập yoga", null, "9h sáng", null, null, null, null, null, false, "mỗi cuối tuần"));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("tập yoga mỗi cuối tuần lúc 9h sáng"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.startTime()).isEqualTo("09:00");
        assertThat(r.recurrenceType()).isEqualTo("WEEKLY");
        assertThat(r.recurrenceDaysOfWeek()).containsExactly(6, 7);
    }

    @Test
    @DisplayName("xem phim mỗi tối thứ 6 → type=event, startTime=19:00, endTime=20:00, WEEKLY with day [5]")
    void parseRecurringEvent_XemPhimMoiToiThu6() {
        mockGroqResponse(json("time_block", "Xem phim", null, null, null, null, null, null, null, false, "mỗi tối thứ 6"));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("xem phim mỗi tối thứ 6"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Xem phim");
        assertThat(r.startTime()).isEqualTo("19:00");
        assertThat(r.endTime()).isEqualTo("20:00");
        assertThat(r.recurrenceType()).isEqualTo("WEEKLY");
        assertThat(r.recurrenceDaysOfWeek()).containsExactly(5);
        assertThat(LocalDate.parse(r.eventDate()).getDayOfWeek()).isEqualTo(java.time.DayOfWeek.FRIDAY);
    }

    @Test
    @DisplayName("no recurrenceExpression → recurrenceType=NONE, recurrenceDays=null")
    void parseNonRecurring_ReturnsNone() {
        mockGroqResponse(json("time_block", "Họp team", "mai", "3h", null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("Mai 3h họp team"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.recurrenceType()).isEqualTo("NONE");
        assertThat(r.recurrenceDaysOfWeek()).isNull();
        assertThat(r.recurrenceEndDate()).isNull();
    }

    @Test
    @DisplayName("timeExpression range '9-11 giờ tối' → startTime=21:00, endTime=23:00, durationMinutes=120")
    void parseTimeRange_Night() {
        mockGroqResponse(json("time_block", "Xem phim", null, "9-11 giờ tối", null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("Xem phim 9-11 giờ tối"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.startTime()).isEqualTo("21:00");
        assertThat(r.endTime()).isEqualTo("23:00");
        assertThat(r.estimatedMinutes()).isEqualTo(120);
    }

    // ── Urgency & Importance ──────────────────────────────────────────────────────

    @Test
    @DisplayName("raw text contains urgency keyword → isUrgent=true")
    void urgencyEvaluator_KeywordInText_ReturnsUrgent() {
        mockGroqResponse(json("deadline", "Nộp báo cáo", "thứ 6", null, null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("nộp báo cáo thứ 6 gấp"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.isUrgent()).isTrue();
    }

    @Test
    @DisplayName("health-domain title → isImportant=true")
    void importanceEvaluator_HealthTitle_ReturnsImportant() {
        mockGroqResponse(json("time_block", "Tập thể dục", "mai", "7h", "1 tiếng", "Health", null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("mai 7h tập thể dục 1 tiếng"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.isImportant()).isTrue();
    }

    @Test
    @DisplayName("category acronym KLTN → resolves to Khóa luận tốt nghiệp")
    void categoryResolver_AcronymMatching_ReturnsCategoryId() {
        UUID catId = UUID.randomUUID();
        nhk.category.Category cat = new nhk.category.Category();
        cat.setId(catId);
        cat.setName("Khóa luận tốt nghiệp");

        when(categoryRepository.findByUserIdOrderByNameAsc(USER_ID)).thenReturn(List.of(cat));
        when(goalRepository.findByUserIdAndStatus(USER_ID, "In Progress")).thenReturn(List.of());
        mockGroqResponse(json("open_task", "Nộp báo cáo", "thứ 6", null, null, "KLTN", null, null, null, false, null));

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("Nộp báo cáo KLTN thứ 6"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.categoryId()).isEqualTo(catId);
    }

    @Test
    @DisplayName("category resolver picks longest matching category over short prefix substring")
    void categoryResolver_LongestMatch_AvoidsPrefixCollision() {
        UUID shortCatId = UUID.randomUUID();
        nhk.category.Category shortCat = new nhk.category.Category();
        shortCat.setId(shortCatId);
        shortCat.setName("Học");

        UUID longCatId = UUID.randomUUID();
        nhk.category.Category longCat = new nhk.category.Category();
        longCat.setId(longCatId);
        longCat.setName("Học tiếng Anh");

        when(categoryRepository.findByUserIdOrderByNameAsc(USER_ID)).thenReturn(List.of(shortCat, longCat));
        when(goalRepository.findByUserIdAndStatus(USER_ID, "In Progress")).thenReturn(List.of());
        mockGroqResponse(json("open_task", "Luyện nghe", null, null, null, "Học tiếng Anh", null, null, null, false, null));

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("Luyện nghe Học tiếng Anh"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.categoryId()).isEqualTo(longCatId);
    }

    // ── Retry behavior ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("invalid JSON on first call → retries with temperature=0.0")
    void parse_InvalidJsonFirstCall_RetriesAtZeroTemperature() {
        stubRepositories();
        stubRestClient();

        doReturn(responseWithContent("not-json"))
                .doReturn(responseWithContent(json("open_task", "Mua sữa", null, null, null, null, null, null, null, false, null)))
                .when(responseSpec).body(eq(Map.class));

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("mua sữa"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        verify(restClient, times(2)).post();

        ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
        verify(requestBodySpec, times(2)).body(captor.capture());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> requests = (List<Map<String, Object>>) (List<?>) captor.getAllValues();
        assertThat(requests.get(0)).containsEntry("temperature", 0.1d);
        assertThat(requests.get(1)).containsEntry("temperature", 0.0d);
    }

    // ── Prompt structure ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("prompt has correct structure: system, few-shots, user context")
    void prompt_HasCorrectStructure() {
        mockGroqResponse(json("open_task", "Test", null, null, null, null, null, null, null, false, null));
        stubRepositories();

        quickAddService.parse(new QuickAddRequest("test input"), USER_ID, "Asia/Ho_Chi_Minh");

        ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
        verify(requestBodySpec).body(captor.capture());

        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) captor.getValue();
        assertThat(payload).containsEntry("model", "test-model");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> messages = (List<Map<String, Object>>) payload.get("messages");
        assertThat(messages.get(0).get("role")).isEqualTo("system");
        assertThat(String.valueOf(messages.get(0).get("content"))).contains("NLP extractor");

        Map<String, Object> last = messages.get(messages.size() - 1);
        assertThat(last.get("role")).isEqualTo("user");
        assertThat(String.valueOf(last.get("content")))
                .contains("Now:")
                .contains("test input");
    }

    @Test
    @DisplayName("missing API key → throws QuickAddExternalServiceException")
    void parse_MissingApiKey_ThrowsException() {
        QuickAddService noKey = new QuickAddService(categoryRepository, goalRepository, new EisenhowerClassifier(new nhk.quickadd.lexicon.LexiconManager()), "", "model", restClient);

        assertThatThrownBy(() -> noKey.parse(new QuickAddRequest("test"), USER_ID, "Asia/Ho_Chi_Minh"))
                .isInstanceOf(QuickAddExternalServiceException.class)
                .hasMessageContaining("GROQ_API_KEY");
    }

    // ── 10 UI Suggestions Tests (EN & VI) ──────────────────────────────────────────

    @Test
    @DisplayName("Task Suggestion 1: team meeting 1 hour tomorrow afternoon")
    void parseTaskSuggestion1() {
        mockGroqResponse(json("deadline", "Team meeting", "tomorrow afternoon", null, "1 hour", null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("team meeting 1 hour tomorrow afternoon"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Team meeting");
        assertThat(r.estimatedMinutes()).isEqualTo(60);
        assertThat(r.dueDate()).isNotNull();
    }

    @Test
    @DisplayName("Task Suggestion 1 (VI): họp team 1 tiếng chiều mai")
    void parseTaskSuggestion1_VI() {
        mockGroqResponse(json("deadline", "Họp team", "chiều mai", null, "1 tiếng", null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("họp team 1 tiếng chiều mai"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Họp team");
        assertThat(r.estimatedMinutes()).isEqualTo(60);
        assertThat(r.dueDate()).isNotNull();
    }

    @Test
    @DisplayName("Task Suggestion 2: read a book 30 minutes tonight")
    void parseTaskSuggestion2() {
        mockGroqResponse(json("deadline", "Read a book", "tonight", null, "30 minutes", null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("read a book 30 minutes tonight"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Read a book");
        assertThat(r.estimatedMinutes()).isEqualTo(30);
        assertThat(r.dueDate()).isNotNull();
    }

    @Test
    @DisplayName("Task Suggestion 2 (VI): đọc sách 30 phút tối nay")
    void parseTaskSuggestion2_VI() {
        mockGroqResponse(json("deadline", "Đọc sách", "tối nay", null, "30 phút", null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("đọc sách 30 phút tối nay"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Đọc sách");
        assertThat(r.estimatedMinutes()).isEqualTo(30);
        assertThat(r.dueDate()).isNotNull();
    }

    @Test
    @DisplayName("Task Suggestion 3: submit report by Friday urgent")
    void parseTaskSuggestion3() {
        mockGroqResponse(json("deadline", "Submit report", "Friday", null, null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("submit report by Friday urgent"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Submit report");
        assertThat(r.isUrgent()).isTrue();
        assertThat(r.dueDate()).isNotNull();
    }

    @Test
    @DisplayName("Task Suggestion 3 (VI): nộp báo cáo trước thứ 6 gấp")
    void parseTaskSuggestion3_VI() {
        mockGroqResponse(json("deadline", "Nộp báo cáo", "thứ 6", null, null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("nộp báo cáo trước thứ 6 gấp"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Nộp báo cáo");
        assertThat(r.isUrgent()).isTrue();
        assertThat(r.dueDate()).isNotNull();
    }

    @Test
    @DisplayName("Task Suggestion 4: buy groceries: eggs, milk, vegetables")
    void parseTaskSuggestion4() {
        mockGroqResponse("""
                {"intent":"open_task","title":"Buy groceries","dateExpression":null,"timeExpression":null,
                 "durationExpression":null,"categoryHint":null,"goalHint":null,"notes":null,
                 "checklists":["eggs","milk","vegetables"],"isAllDay":false,"recurrenceExpression":null}""");
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("buy groceries: eggs, milk, vegetables"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Buy groceries");
        assertThat(r.checklists()).hasSize(3);
        assertThat(r.checklists().get(0).title()).isEqualTo("eggs");
    }

    @Test
    @DisplayName("Task Suggestion 4 (VI): mua đồ: trứng, sữa, rau")
    void parseTaskSuggestion4_VI() {
        mockGroqResponse("""
                {"intent":"open_task","title":"Mua đồ","dateExpression":null,"timeExpression":null,
                 "durationExpression":null,"categoryHint":null,"goalHint":null,"notes":null,
                 "checklists":["trứng","sữa","rau"],"isAllDay":false,"recurrenceExpression":null}""");
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("mua đồ: trứng, sữa, rau"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Mua đồ");
        assertThat(r.checklists()).hasSize(3);
        assertThat(r.checklists().get(0).title()).isEqualTo("trứng");
    }

    @Test
    @DisplayName("Task Suggestion 5: plan Q3 2 hours #work goal: increase revenue note: room B2")
    void parseTaskSuggestion5() {
        mockGroqResponse(json("open_task", "Plan Q3", null, null, "2 hours", "work", "increase revenue", "room B2", null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("plan Q3 2 hours #work goal: increase revenue note: room B2"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Plan Q3");
        assertThat(r.estimatedMinutes()).isEqualTo(120);
        assertThat(r.notes()).isEqualTo("room B2");
    }

    @Test
    @DisplayName("Task Suggestion 5 (VI): lập kế hoạch Q3 2 tiếng #work mục tiêu: tăng doanh thu ghi chú: phòng B2")
    void parseTaskSuggestion5_VI() {
        mockGroqResponse(json("open_task", "Lập kế hoạch Q3", null, null, "2 tiếng", "work", "tăng doanh thu", "phòng B2", null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("lập kế hoạch Q3 2 tiếng #work mục tiêu: tăng doanh thu ghi chú: phòng B2"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Lập kế hoạch Q3");
        assertThat(r.estimatedMinutes()).isEqualTo(120);
        assertThat(r.notes()).isEqualTo("phòng B2");
    }

    @Test
    @DisplayName("Task Suggestion 6: clean up email 15 minutes tomorrow morning checklist: inbox, spam, follow-up")
    void parseTaskSuggestion6() {
        mockGroqResponse("""
                {"intent":"deadline","title":"Clean up email","dateExpression":"tomorrow morning","timeExpression":null,
                 "durationExpression":"15 minutes","categoryHint":null,"goalHint":null,"notes":null,
                 "checklists":["inbox","spam","follow-up"],"isAllDay":false,"recurrenceExpression":null}""");
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("clean up email 15 minutes tomorrow morning checklist: inbox, spam, follow-up"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Clean up email");
        assertThat(r.estimatedMinutes()).isEqualTo(15);
        assertThat(r.checklists()).hasSize(3);
    }

    @Test
    @DisplayName("Task Suggestion 6 (VI): dọn dẹp email 15 phút sáng mai danh sách: inbox, spam, follow-up")
    void parseTaskSuggestion6_VI() {
        mockGroqResponse("""
                {"intent":"deadline","title":"Dọn dẹp email","dateExpression":"sáng mai","timeExpression":null,
                 "durationExpression":"15 phút","categoryHint":null,"goalHint":null,"notes":null,
                 "checklists":["inbox","spam","follow-up"],"isAllDay":false,"recurrenceExpression":null}""");
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("dọn dẹp email 15 phút sáng mai danh sách: inbox, spam, follow-up"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Dọn dẹp email");
        assertThat(r.estimatedMinutes()).isEqualTo(15);
        assertThat(r.checklists()).hasSize(3);
    }

    @Test
    @DisplayName("Event Suggestion 1: team meeting at 3pm tomorrow")
    void parseEventSuggestion1() {
        mockGroqResponse(json("time_block", "Team meeting", "tomorrow", "3pm", null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("team meeting at 3pm tomorrow"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Team meeting");
        assertThat(r.startTime()).isEqualTo("15:00");
        assertThat(r.endTime()).isEqualTo("16:00");
    }

    @Test
    @DisplayName("Event Suggestion 1 (VI): họp team lúc 3h chiều mai")
    void parseEventSuggestion1_VI() {
        mockGroqResponse(json("time_block", "Họp team", "mai", "3h chiều", null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("họp team lúc 3h chiều mai"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Họp team");
        assertThat(r.startTime()).isEqualTo("15:00");
        assertThat(r.endTime()).isEqualTo("16:00");
    }

    @Test
    @DisplayName("Event Suggestion 2: interview Tuesday 10am")
    void parseEventSuggestion2() {
        mockGroqResponse(json("time_block", "Interview", "Tuesday", "10am", null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("interview Tuesday 10am"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Interview");
        assertThat(r.startTime()).isEqualTo("10:00");
        assertThat(r.endTime()).isEqualTo("11:00");
    }

    @Test
    @DisplayName("Event Suggestion 2 (VI): phỏng vấn thứ 3 lúc 10h")
    void parseEventSuggestion2_VI() {
        mockGroqResponse(json("time_block", "Phỏng vấn", "thứ 3", "10h", null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("phỏng vấn thứ 3 lúc 10h"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Phỏng vấn");
        assertThat(r.startTime()).isEqualTo("10:00");
        assertThat(r.endTime()).isEqualTo("11:00");
    }

    @Test
    @DisplayName("Event Suggestion 3: run 6am - 7am tomorrow #health")
    void parseEventSuggestion3() {
        mockGroqResponse(json("time_block", "Run", "tomorrow", "6am - 7am", null, "health", null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("run 6am - 7am tomorrow #health"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Run");
        assertThat(r.startTime()).isEqualTo("06:00");
        assertThat(r.endTime()).isEqualTo("07:00");
    }

    @Test
    @DisplayName("Event Suggestion 3 (VI): chạy bộ 6h - 7h sáng mai #health")
    void parseEventSuggestion3_VI() {
        mockGroqResponse(json("time_block", "Chạy bộ", "sáng mai", "6h - 7h", null, "health", null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("chạy bộ 6h - 7h sáng mai #health"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Chạy bộ");
        assertThat(r.startTime()).isEqualTo("06:00");
        assertThat(r.endTime()).isEqualTo("07:00");
    }

    @Test
    @DisplayName("Event Suggestion 4: mom's birthday all day Sunday note: call in the evening")
    void parseEventSuggestion4() {
        mockGroqResponse(json("open_task", "Mom's birthday", "Sunday", null, null, null, null, "call in the evening", null, true, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("mom's birthday all day Sunday note: call in the evening"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Mom's birthday");
        assertThat(r.isAllDay()).isTrue();
        assertThat(r.notes()).isEqualTo("call in the evening");
    }

    @Test
    @DisplayName("Event Suggestion 4 (VI): sinh nhật mẹ cả ngày chủ nhật ghi chú: gọi điện vào buổi tối")
    void parseEventSuggestion4_VI() {
        mockGroqResponse(json("open_task", "Sinh nhật mẹ", "chủ nhật", null, null, null, null, "gọi điện vào buổi tối", null, true, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("sinh nhật mẹ cả ngày chủ nhật ghi chú: gọi điện vào buổi tối"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Sinh nhật mẹ");
        assertThat(r.isAllDay()).isTrue();
        assertThat(r.notes()).isEqualTo("gọi điện vào buổi tối");
    }

    // ── Caching & Natural Vietnamese Resolvers Tests ──────────────────────────────

    @Test
    @DisplayName("cache hit: subsequent duplicate request returns cached result without calling Groq API again")
    void parse_CacheHit_DoesNotCallGroqSecondTime() {
        mockGroqResponse(json("open_task", "Đọc sách Clean Code", null, null, "30 phút", null, null, null, null, false, null));
        stubRepositories();

        // 1st call -> calls Groq
        QuickAddResponse r1 = quickAddService.parse(new QuickAddRequest("đọc sách Clean Code trong 30 phút"), USER_ID, "Asia/Ho_Chi_Minh");
        assertThat(r1.title()).isEqualTo("Đọc sách Clean Code");

        // 2nd call with same text -> cache hit
        QuickAddResponse r2 = quickAddService.parse(new QuickAddRequest("đọc sách Clean Code trong 30 phút"), USER_ID, "Asia/Ho_Chi_Minh");
        assertThat(r2.title()).isEqualTo("Đọc sách Clean Code");

        // Verify restClient was called exactly 1 time
        verify(restClient, times(1)).post();
    }

    @Test
    @DisplayName("cross-day cache hit: cached extraction dynamically resolves relative dates (e.g. 'mai')")
    void parse_CacheHit_CrossDay_ResolvesDateDynamically() {
        mockGroqResponse(json("time_block", "Khám sức khỏe", "mai", "8h", "1 tiếng", null, null, null, null, false, null));
        stubRepositories();

        // 1st call
        QuickAddResponse r1 = quickAddService.parse(new QuickAddRequest("mai 8h khám sức khỏe"), USER_ID, "Asia/Ho_Chi_Minh");
        String expectedTomorrow = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(1).toString();
        assertThat(r1.eventDate()).isEqualTo(expectedTomorrow);

        // 2nd call (simulated cache hit)
        QuickAddResponse r2 = quickAddService.parse(new QuickAddRequest("mai 8h khám sức khỏe"), USER_ID, "Asia/Ho_Chi_Minh");
        assertThat(r2.eventDate()).isEqualTo(expectedTomorrow);

        // Verify Groq was called only once
        verify(restClient, times(1)).post();
    }

    @Test
    @DisplayName("duration: 'tiếng rưỡi' resolves to 90 minutes and 'nửa tiếng' to 30 minutes")
    void parseDuration_TiengRuoiAndNuaTieng() {
        mockGroqResponse(json("time_block", "Họp phòng kỹ thuật", "mai", "2h chiều", "tiếng rưỡi", null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("mai 2h chiều họp phòng kỹ thuật tiếng rưỡi"), USER_ID, "Asia/Ho_Chi_Minh");
        assertThat(r.estimatedMinutes()).isEqualTo(90);
        assertThat(r.startTime()).isEqualTo("14:00");
        assertThat(r.endTime()).isEqualTo("15:30");
    }

    @Test
    @DisplayName("duration: '2 tiếng rưỡi' resolves to 150 minutes and '45p' to 45 minutes")
    void parseDuration_HaiTiengRuoiAndShortP() {
        mockGroqResponse(json("open_task", "Làm bài tập lớn", null, null, "2 tiếng rưỡi", null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("làm bài tập lớn 2 tiếng rưỡi"), USER_ID, "Asia/Ho_Chi_Minh");
        assertThat(r.estimatedMinutes()).isEqualTo(150);
    }

    @Test
    @DisplayName("date: '3 ngày nữa' resolves to today + 3 days")
    void parseDate_RelativeThreeDays() {
        mockGroqResponse(json("deadline", "Nộp báo cáo tiến độ", "3 ngày nữa", null, null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("3 ngày nữa nộp báo cáo tiến độ"), USER_ID, "Asia/Ho_Chi_Minh");
        String expectedDate = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(3).toString();
        assertThat(r.dueDate()).isNotNull().startsWith(expectedDate);
    }

    @Test
    @DisplayName("time: '8 rưỡi sáng' resolves to 08:30 and '8h kém 15' resolves to 07:45")
    void parseTime_RuoiAndKem() {
        mockGroqResponse(json("time_block", "Đi khám răng", "mai", "8 rưỡi sáng", "1 tiếng", null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("mai 8 rưỡi sáng đi khám răng 1 tiếng"), USER_ID, "Asia/Ho_Chi_Minh");
        assertThat(r.startTime()).isEqualTo("08:30");
        assertThat(r.endTime()).isEqualTo("09:30");
    }

    @Test
    @DisplayName("specific start time: 'tối nay tìm việc lúc 7 giờ' resolves to event with startTime=19:00 and eventDate=today")
    void parseSpecificStartTime_ResolvesAsEvent() {
        mockGroqResponse(json("time_block", "Tìm việc", "tối nay", "7 giờ", "1 tiếng", null, null, null, null, false, null));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("tối nay tìm việc lúc 7 giờ"), USER_ID, "Asia/Ho_Chi_Minh");
        String expectedToday = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).toString();

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Tìm việc");
        assertThat(r.startTime()).isEqualTo("19:00");
        assertThat(r.endTime()).isEqualTo("20:00");
        assertThat(r.eventDate()).isEqualTo(expectedToday);
        assertThat(r.dueDate()).isNull();
    }

    @Test
    @DisplayName("semantic category: 'nấu ăn' with categoryHint='Daily' resolves to Daily category UUID")
    void parseSemanticCategory_NauAn_ResolvesToDaily() {
        UUID dailyCatId = UUID.randomUUID();
        nhk.category.Category dailyCat = new nhk.category.Category();
        dailyCat.setId(dailyCatId);
        dailyCat.setName("Daily");
        dailyCat.setUserId(USER_ID);

        mockGroqResponse(json("open_task", "Nấu ăn", null, null, "45 phút", "Daily", null, null, null, false, null));
        when(categoryRepository.findByUserIdOrderByNameAsc(USER_ID)).thenReturn(List.of(dailyCat));
        when(goalRepository.findByUserIdAndStatus(USER_ID, "In Progress")).thenReturn(List.of());

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("nấu ăn trong 45 phút"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Nấu ăn");
        assertThat(r.categoryId()).isEqualTo(dailyCatId);
        assertThat(r.estimatedMinutes()).isEqualTo(45);
    }

    @Test
    @DisplayName("quadrant Q1: urgent deadline + goal -> isUrgent=true, isImportant=true")
    void parseQuadrant_Q1_Crisis() {
        mockGroqResponse(json("deadline", "Nộp báo cáo KLTN", "mai", "17h", null, null, "KLTN", null, null, false, null, 1.0, 1.0));
        UUID goalId = UUID.randomUUID();
        nhk.goal.Goal kltnGoal = new nhk.goal.Goal();
        kltnGoal.setId(goalId);
        kltnGoal.setTitle("KLTN");
        when(categoryRepository.findByUserIdOrderByNameAsc(USER_ID)).thenReturn(List.of());
        when(goalRepository.findByUserIdAndStatus(USER_ID, "In Progress")).thenReturn(List.of(kltnGoal));

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("mai 17h nộp báo cáo KLTN gấp"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.isUrgent()).isTrue();
        assertThat(r.isImportant()).isTrue();
        assertThat(r.goalId()).isEqualTo(goalId);
    }

    @Test
    @DisplayName("quadrant Q2: skill investment without urgent deadline -> isUrgent=false, isImportant=true")
    void parseQuadrant_Q2_Investment() {
        mockGroqResponse(json("open_task", "Học 20 từ vựng tiếng Anh", null, null, "30 phút", null, null, null, null, false, null, 1.0, 0.0));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("học 20 từ vựng tiếng Anh 30 phút"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.isUrgent()).isFalse();
        assertThat(r.isImportant()).isTrue();
    }

    @Test
    @DisplayName("quadrant Q3: routine daily chore -> isUrgent=true, isImportant=false")
    void parseQuadrant_Q3_MaintenanceChore() {
        mockGroqResponse(json("open_task", "Nấu ăn và dọn bếp", null, null, "45 phút", null, null, null, null, false, null, 0.0, 1.0));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("nấu ăn và dọn bếp trong 45 phút"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.isUrgent()).isTrue();
        assertThat(r.isImportant()).isFalse();
    }

    @Test
    @DisplayName("quadrant Q4: leisure / entertainment -> isUrgent=false, isImportant=false")
    void parseQuadrant_Q4_Leisure() {
        mockGroqResponse(json("open_task", "Lướt TikTok xem video", null, null, null, null, null, null, null, false, null, 0.0, 0.0));
        stubRepositories();

        QuickAddResponse r = quickAddService.parse(new QuickAddRequest("lướt TikTok xem video"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.isUrgent()).isFalse();
        assertThat(r.isImportant()).isFalse();
    }

    @Test
    @DisplayName("Task with duration in middle: 'Đi bách hóa xanh 1 tiếng mua rau' extracts duration=60 and clean title")
    void parseTaskWithDurationInMiddle_BachHoaXanh() {
        QuickAddService serviceWithFastPath = new QuickAddService(
                categoryRepository, goalRepository, new EisenhowerClassifier(new nhk.quickadd.lexicon.LexiconManager()),
                new QuickAddCache(), new UserContextVersionService(), new ExtractionSchemaValidator(), new ExtractionSemanticValidator(),
                new FastPathParser(), "test-key", "test-model", null);
        stubRepositories();

        QuickAddResponse r = serviceWithFastPath.parse(new QuickAddRequest("Đi bách hóa xanh 1 tiếng mua rau"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("task");
        assertThat(r.title()).isEqualTo("Đi bách hóa xanh mua rau");
        assertThat(r.estimatedMinutes()).isEqualTo(60);
    }

    @Test
    @DisplayName("Event with start time: 'ăn sáng ở macdonal 7 giờ sáng mai' extracts event with startTime=07:00, endTime=08:00, date=tomorrow")
    void parseEventWithStartTime_AnSangMacdonald() {
        QuickAddService serviceWithFastPath = new QuickAddService(
                categoryRepository, goalRepository, new EisenhowerClassifier(new nhk.quickadd.lexicon.LexiconManager()),
                new QuickAddCache(), new UserContextVersionService(), new ExtractionSchemaValidator(), new ExtractionSemanticValidator(),
                new FastPathParser(), "test-key", "test-model", null);
        stubRepositories();

        QuickAddResponse r = serviceWithFastPath.parse(new QuickAddRequest("ăn sáng ở macdonal 7 giờ sáng mai"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Ăn sáng ở macdonal");
        assertThat(r.startTime()).isEqualTo("07:00");
        assertThat(r.endTime()).isEqualTo("08:00");
        String expectedTomorrow = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(1).toString();
        assertThat(r.eventDate()).isEqualTo(expectedTomorrow);
    }

    @Test
    @DisplayName("Event with time, date and duration: 'về quê 3 giờ chiều mai 4 tiếng' extracts startTime=15:00, endTime=19:00, estimatedMinutes=240")
    void parseEventWithTimeDateAndDuration_VeQue() {
        QuickAddService serviceWithFastPath = new QuickAddService(
                categoryRepository, goalRepository, new EisenhowerClassifier(new nhk.quickadd.lexicon.LexiconManager()),
                new QuickAddCache(), new UserContextVersionService(), new ExtractionSchemaValidator(), new ExtractionSemanticValidator(),
                new FastPathParser(), "test-key", "test-model", null);
        stubRepositories();

        QuickAddResponse r = serviceWithFastPath.parse(new QuickAddRequest("về quê 3 giờ chiều mai 4 tiếng"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Về quê");
        assertThat(r.startTime()).isEqualTo("15:00");
        assertThat(r.endTime()).isEqualTo("19:00");
        assertThat(r.estimatedMinutes()).isEqualTo(240);
        String expectedTomorrow = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(1).toString();
        assertThat(r.eventDate()).isEqualTo(expectedTomorrow);
    }

    @Test
    @DisplayName("Recurring event: 'Gọi cho mẹ vào tối thứ 2 hàng tuần' extracts weekly recurrence on Mon with 19:00 start")
    void parseRecurringEvent_GoiChoMeToiThu2HangTuan() {
        QuickAddService serviceWithFastPath = new QuickAddService(
                categoryRepository, goalRepository, new EisenhowerClassifier(new nhk.quickadd.lexicon.LexiconManager()),
                new QuickAddCache(), new UserContextVersionService(), new ExtractionSchemaValidator(), new ExtractionSemanticValidator(),
                new FastPathParser(), "test-key", "test-model", null);
        stubRepositories();

        QuickAddResponse r = serviceWithFastPath.parse(new QuickAddRequest("Gọi cho mẹ vào tối thứ 2 hàng tuần"), USER_ID, "Asia/Ho_Chi_Minh");

        assertThat(r.type()).isEqualTo("event");
        assertThat(r.title()).isEqualTo("Gọi cho mẹ");
        assertThat(r.recurrenceType()).isEqualTo("WEEKLY");
        assertThat(r.recurrenceDaysOfWeek()).containsExactly(1);
        assertThat(r.startTime()).isEqualTo("19:00");
    }

    @Test
    @DisplayName("FastPath hit returns source=FAST_PATH")
    void parseFastPath_ReturnsSourceFastPath() {
        QuickAddService serviceWithFastPath = new QuickAddService(
                categoryRepository, goalRepository, new EisenhowerClassifier(new nhk.quickadd.lexicon.LexiconManager()),
                new QuickAddCache(), new UserContextVersionService(), new ExtractionSchemaValidator(), new ExtractionSemanticValidator(),
                new FastPathParser(), "test-key", "test-model", null);
        stubRepositories();

        QuickAddResponse r = serviceWithFastPath.parse(new QuickAddRequest("mua sữa"), USER_ID, "Asia/Ho_Chi_Minh");
        assertThat(r.source()).isEqualTo("FAST_PATH");
    }

    @Test
    @DisplayName("forceAi=true bypasses FastPath and calls AI client returning source=AI")
    void parseForceAi_BypassesFastPath() {
        mockGroqResponse(json("open_task", "Mua sữa", null, null, null, null, null, null, null, false, null));
        stubRepositories();

        QuickAddService serviceWithFastPath = new QuickAddService(
                categoryRepository, goalRepository, new EisenhowerClassifier(new nhk.quickadd.lexicon.LexiconManager()),
                new QuickAddCache(), new UserContextVersionService(), new ExtractionSchemaValidator(), new ExtractionSemanticValidator(),
                "test-key", "test-model", restClient, null, new FastPathParser());

        QuickAddResponse r = serviceWithFastPath.parse(new QuickAddRequest("mua sữa", true), USER_ID, "Asia/Ho_Chi_Minh");
        assertThat(r.source()).isEqualTo("AI");
        assertThat(r.title()).isEqualTo("Mua sữa");
    }

    @Test
    @DisplayName("FastPath in-text goal acronym match resolves goal and inherits category")
    void parseFastPath_InTextGoalAcronym_ResolvesGoalAndInheritsCategory() {
        Category hocTap = new Category();
        hocTap.setId(UUID.randomUUID());
        hocTap.setName("Học tập");

        Goal kltn = new Goal();
        kltn.setId(UUID.randomUUID());
        kltn.setTitle("Khóa luận tốt nghiệp");
        kltn.setCategoryId(hocTap.getId());

        when(categoryRepository.findByUserIdOrderByNameAsc(USER_ID)).thenReturn(List.of(hocTap));
        when(goalRepository.findByUserIdAndStatus(USER_ID, "In Progress")).thenReturn(List.of(kltn));

        QuickAddService service = new QuickAddService(
                categoryRepository, goalRepository, new EisenhowerClassifier(new nhk.quickadd.lexicon.LexiconManager()),
                new QuickAddCache(), new UserContextVersionService(), new ExtractionSchemaValidator(), new ExtractionSemanticValidator(),
                new FastPathParser(), "test-key", "test-model", null);

        QuickAddResponse r = service.parse(new QuickAddRequest("Làm slide KLTN tối nay 2 tiếng"), USER_ID, "Asia/Ho_Chi_Minh");
        assertThat(r.source()).isEqualTo("FAST_PATH");
        assertThat(r.goalId()).isEqualTo(kltn.getId());
        assertThat(r.categoryId()).isEqualTo(hocTap.getId());
    }

    @Test
    @DisplayName("FastPath domain fallback resolves category from domain signals (e.g. khám răng → Sức khỏe)")
    void parseFastPath_DomainSignalFallback_ResolvesCategory() {
        Category sucKhoe = new Category();
        sucKhoe.setId(UUID.randomUUID());
        sucKhoe.setName("Sức khỏe");

        when(categoryRepository.findByUserIdOrderByNameAsc(USER_ID)).thenReturn(List.of(sucKhoe));
        when(goalRepository.findByUserIdAndStatus(USER_ID, "In Progress")).thenReturn(List.of());

        QuickAddService service = new QuickAddService(
                categoryRepository, goalRepository, new EisenhowerClassifier(new nhk.quickadd.lexicon.LexiconManager()),
                new QuickAddCache(), new UserContextVersionService(), new ExtractionSchemaValidator(), new ExtractionSemanticValidator(),
                new FastPathParser(), "test-key", "test-model", null);

        QuickAddResponse r = service.parse(new QuickAddRequest("Khám răng lúc 8h sáng mai"), USER_ID, "Asia/Ho_Chi_Minh");
        assertThat(r.source()).isEqualTo("FAST_PATH");
        assertThat(r.categoryId()).isEqualTo(sucKhoe.getId());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────────

    private void stubRepositories() {
        when(categoryRepository.findByUserIdOrderByNameAsc(USER_ID)).thenReturn(List.of());
        when(goalRepository.findByUserIdAndStatus(USER_ID, "In Progress")).thenReturn(List.of());
    }

    private void mockGroqResponse(String content) {
        stubRestClient();
        doReturn(responseWithContent(content)).when(responseSpec).body(eq(Map.class));
    }

    private void stubRestClient() {
        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(any(String.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.contentType(MediaType.APPLICATION_JSON)).thenReturn(requestBodySpec);
        when(requestBodySpec.header(eq("Authorization"), any(String.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any(Object.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
    }

    private Map<String, Object> responseWithContent(String content) {
        return Map.of("choices", List.of(Map.of("message", Map.of("content", content))));
    }

    private String json(
            String intent, String title,
            String dateExpr, String timeExpr, String durationExpr,
            String categoryHint, String goalHint, String notes, Object checklists,
            boolean isAllDay, String recurrenceExpr
    ) {
        return json(intent, title, dateExpr, timeExpr, durationExpr, categoryHint, goalHint, notes, checklists, isAllDay, recurrenceExpr, null, null);
    }

    private String json(
            String intent, String title,
            String dateExpr, String timeExpr, String durationExpr,
            String categoryHint, String goalHint, String notes, Object checklists,
            boolean isAllDay, String recurrenceExpr,
            Double i, Double u
    ) {
        return String.format(
                """
                {"intent":%s,"title":%s,"dateExpression":%s,"timeExpression":%s,\
                "durationExpression":%s,"categoryHint":%s,"goalHint":%s,"notes":%s,\
                "checklists":%s,"isAllDay":%s,"recurrenceExpression":%s,"i":%s,"u":%s}""",
                q(intent), q(title), q(dateExpr), q(timeExpr), q(durationExpr),
                q(categoryHint), q(goalHint), q(notes),
                checklists == null ? "null" : checklists,
                isAllDay,
                q(recurrenceExpr),
                i == null ? "null" : i,
                u == null ? "null" : u
        );
    }

    private String q(String v) {
        return v == null ? "null" : "\"" + v + "\"";
    }
}