package nhk.quickadd;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * High-performance, zero-latency deterministic parser for straightforward Quick Add queries.
 * Returns an AiExtraction immediately if a high-confidence match is found, bypassing LLM call.
 */
@Component
public class FastPathParser {

    private final InputComplexityAnalyzer complexityAnalyzer;

    // ── Pre-processing Patterns ───────────────────────────────────────────────
    private static final Pattern URGENT_PREFIX = Pattern.compile(
            "^(?:gấp|urgent|khẩn cấp|gấp!|urgent!|khẩn cấp!)\\s*[:;,-]?\\s*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern URGENT_SUFFIX = Pattern.compile(
            "\\s+(?:gấp|urgent|khẩn cấp|gấp!|urgent!|khẩn cấp!)$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern PRIORITY_SHORTCUT_PATTERN = Pattern.compile(
            "!(?:q([1-4])|p([1-4])|urgent|important|high|low|do_first|schedule|delegate|eliminate)\\b",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern HASHTAG_PATTERN = Pattern.compile(
            "#(?:\"([^\"]+)\"|([\\p{L}\\d_-]+))"
    );
    private static final Pattern AT_GOAL_PATTERN = Pattern.compile(
            "@(?:\"([^\"]+)\"|([\\p{L}\\d_-]+))"
    );
    private static final Pattern NOTE_PATTERN = Pattern.compile(
            "(?:\\s+|^)(?:note|ghi chú|ghi chu)\\s*[:;-]\\s*(.+)$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern GOAL_EXPLICIT_PATTERN = Pattern.compile(
            "(?:\\s+|^)(?:mục tiêu|muc tieu|goal)\\s*[:;-]\\s*([\\p{L}\\d\\s_-]+?)(?=(?:\\s+(?:note|ghi chú|ghi chu|#|!|@)|$))",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // ── Entity extraction fragments ──────────────────────────────────────────
    private static final String DURATION_REGEX =
            "(?:\\d+(?:[.,]\\d+)?\\s*(?:tiếng|tieng|h|giờ|gio|phút|phut|p|m|mins?|minutes?|hours?)(?:\\s*\\d+\\s*(?:phút|phut|p|m|mins?|minutes?))?|nửa tiếng|nua tieng|tiếng rưỡi|tieng ruoi|1 tiếng 30 phút|1 tieng 30 phut|2h30|1h30|1h|2h|3h|30p|45p|15p|15m|30m|45m)";

    private static final String TIME_POINT_REGEX =
            "(?:\\d{1,2}(?:[h:]\\d{2}|\\s*(?:giờ|gio)\\s*\\d{1,2}|[h:g]|\\s*(?:giờ|gio))?(?:\\s*(?:sang|sáng|chieu|chiều|toi|tối|trua|trưa|dem|đêm|am|pm))|\\d{1,2}:\\d{2}|\\d{1,2}\\s*h\\d{2}|\\d{1,2}\\s*(?:h|gio|giờ)(?:\\s*(?:sang|sáng|chieu|chiều|toi|tối|trua|trưa|dem|đêm|am|pm))?|\\d{1,2}\\s*rưỡi(?:\\s*(?:sang|sáng|chieu|chiều|toi|tối))?|\\d{1,2}\\s*h\\s*kém\\s*\\d{1,2})";

    private static final String DATE_REGEX =
            "(?:tomorrow\\s+afternoon|tomorrow\\s+morning|tomorrow\\s+evening|tomorrow\\s+night|this\\s+afternoon|this\\s+morning|this\\s+evening|sáng mai|chiều mai|tối mai|trưa mai|đêm mai|sáng nay|chiều nay|tối nay|trưa nay|đêm nay|ngày mai|hôm nay|ngày mốt|ngày kia|thứ\\s*[2-7]|chủ nhật|cuối tuần(?:\\s*này|\\s*nay|\\s*sau)?|đầu tuần(?:\\s*này|\\s*sau)?|cuối tháng(?:\\s*này|\\s*nay|\\s*sau)?|ngày\\s*\\d{1,2}(?:[/-]\\d{1,2})?|mai|today|tomorrow|tonight|next week|this weekend)";

    private static final String DAYS_OF_WEEK_REGEX =
            "(?:thứ\\s*[2-7]|thứ\\s*hai|thứ\\s*ba|thứ\\s*tư|thứ\\s*tu|thứ\\s*năm|thứ\\s*nam|thứ\\s*sáu|thứ\\s*sau|thứ\\s*bảy|thứ\\s*bay|chủ nhật|chu nhat|cn|t[2-7]|monday|tuesday|wednesday|thursday|friday|saturday|sunday)";

    private static final String SINGLE_DAY_OR_DIGIT =
            "(?:" + DAYS_OF_WEEK_REGEX + "|[2-7])";

    private static final String DAYS_LIST_REGEX =
            "(?:(?:thứ\\s*|t)?[2-7]\\s*(?:đến|den|tới|toi|-)\\s*(?:thứ\\s*|t)?[2-7]|cuối tuần|cuoi tuan|các ngày trong tuần|cac ngay trong tuan|ngày trong tuần|ngay trong tuan|ngày thường|ngay thuong|weekdays|weekend|" +
            SINGLE_DAY_OR_DIGIT + "(?:(?:\\s*[,;+-]|\\s+và|\\s+and|\\s+)?\\s*" + SINGLE_DAY_OR_DIGIT + ")*)";

    private static final String RECURRENCE_REGEX =
            "(?:(?:vào\\s+)?(?:tối|toi|sáng|sang|chiều|chieu|trưa|trua|đêm|dem)?\\s*" + DAYS_LIST_REGEX + "\\s+(?:hàng tuần|hang tuan|mỗi tuần|moi tuan|weekly|every week)" +
            "|(?:mỗi|moi|hàng|hang|every)\\s+(?:tối|toi|sáng|sang|chiều|chieu|trưa|trua|đêm|dem)?\\s*" + DAYS_LIST_REGEX +
            "|(?:hàng tuần|hang tuan|mỗi tuần|moi tuan)\\s+(?:vào\\s+)?(?:tối|toi|sáng|sang|chiều|chieu|trưa|trua|đêm|dem)?\\s*" + DAYS_LIST_REGEX +
            "|hàng ngày|hang ngay|mỗi ngày|moi ngay|daily|every day|hàng tuần|hang tuan|mỗi tuần|moi tuan|weekly|every week|hàng tháng|hang thang|mỗi tháng|moi thang|monthly)";

    // ── Matching Patterns ─────────────────────────────────────────────────────

    // Recurring Events
    private static final Pattern RECURRING_EVENT_REC_TIME_TITLE = Pattern.compile(
            "^(" + RECURRENCE_REGEX + ")\\s+(?:lúc|vào lúc|vào|at)?\\s*(" + TIME_POINT_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)(?:\\s+(" + DURATION_REGEX + "))?$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern RECURRING_EVENT_TIME_REC_TITLE = Pattern.compile(
            "^(?:lúc|vào lúc|vào|at)?\\s*(" + TIME_POINT_REGEX + ")\\s+(" + RECURRENCE_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)(?:\\s+(" + DURATION_REGEX + "))?$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern RECURRING_EVENT_TITLE_TIME_REC = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)(?:\\s+(?:lúc|vào lúc|vào|at))?\\s+(" + TIME_POINT_REGEX + ")\\s+(" + RECURRENCE_REGEX + ")(?:\\s+(" + DURATION_REGEX + "))?$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern RECURRING_EVENT_TITLE_REC_TIME = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(" + RECURRENCE_REGEX + ")\\s+(?:lúc|vào lúc|vào|at)?\\s*(" + TIME_POINT_REGEX + ")(?:\\s+(" + DURATION_REGEX + "))?$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern RECURRING_EVENT_TITLE_REC = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(" + RECURRENCE_REGEX + ")(?:\\s+(" + DURATION_REGEX + "))?$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern RECURRING_EVENT_REC_TITLE = Pattern.compile(
            "^(" + RECURRENCE_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)(?:\\s+(" + DURATION_REGEX + "))?$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern RECURRING_STANDALONE_WITH_TIME = Pattern.compile(
            "^(" + RECURRENCE_REGEX + ")\\s+(?:lúc|vào lúc|vào|at)?\\s*(" + TIME_POINT_REGEX + ")(?:\\s+(" + DURATION_REGEX + "))?$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern RECURRING_STANDALONE_ONLY = Pattern.compile(
            "^(" + RECURRENCE_REGEX + ")$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final String TIME_RANGE_REGEX =
            "(?:(?:từ|tu)\\s+)?(?:\\d{1,2}(?:[h:]\\d{2}|\\s*(?:giờ|gio)\\s*\\d{1,2}|[h:g]|\\s*(?:giờ|gio))?\\s*(?:sang|sáng|chieu|chiều|toi|tối|trua|trưa|dem|đêm|am|pm)?\\s*(?:[-–—]|den|đến|toi|tới|to)\\s*\\d{1,2}(?:[h:]\\d{2}|\\s*(?:giờ|gio)\\s*\\d{1,2}|[h:g]|\\s*(?:giờ|gio))?(?:\\s*(?:sang|sáng|chieu|chiều|toi|tối|trua|trưa|dem|đêm|am|pm))?)";

    // Event Range: "Đánh cầu 1-3 giờ chiều", "Họp team 9h - 10h sáng mai", "Họp phòng 14:00 - 15:30 mai", "Chơi đá bóng 15h-17h"
    private static final Pattern CLEAN_EVENT_RANGE_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(" + TIME_RANGE_REGEX + ")(?:\\s+(" + DATE_REGEX + "))?$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Event Range with Date First: "Sáng mai 9h-11h họp team", "Chiều mai 1-3 giờ đánh cầu"
    private static final Pattern CLEAN_EVENT_DATE_RANGE_PATTERN = Pattern.compile(
            "^(" + DATE_REGEX + ")\\s+(" + TIME_RANGE_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Event with Start Time: "Khám răng lúc 8h sáng mai", "Ăn sáng ở macdonal 7 giờ sáng mai", "Họp phòng lúc 14h", "Đi cafe 8h tối nay"
    private static final Pattern CLEAN_EVENT_START_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(?:lúc|vào lúc|at\\s+)?(" + TIME_POINT_REGEX + ")(?:\\s+(" + DATE_REGEX + "))?$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Event with Date First and Start Time: "Sáng mai 7 giờ ăn sáng ở macdonal", "Tối nay lúc 8h đi cafe"
    private static final Pattern CLEAN_EVENT_DATE_TIME_PATTERN = Pattern.compile(
            "^(" + DATE_REGEX + ")\\s+(?:lúc|vào lúc|at\\s+)?(" + TIME_POINT_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Event with Time First and Date: "7 giờ sáng mai ăn sáng ở macdonal", "8h tối nay đi cafe"
    private static final Pattern CLEAN_EVENT_TIME_DATE_PATTERN = Pattern.compile(
            "^(" + TIME_POINT_REGEX + ")\\s+(" + DATE_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Deadline: "Nộp báo cáo trước 17h", "Nộp bài trước 17h chiều mai", "Nộp đồ án trước thứ 6", "submit report by Friday"
    private static final Pattern CLEAN_DEADLINE_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(?:trước|truoc|deadline|hạn chót|han chot|hạn cuối|han cuoi|by)\\s+(?:lúc\\s*)?(\\d{1,2}(?:h|:\\d{2})(?:\\s*(?:sang|sáng|chieu|chiều|toi|tối|dem|đêm|am|pm))?)?(?:\\s*(" + DATE_REGEX + "))?$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern CLEAN_DEADLINE_DATE_FIRST = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(?:trước|truoc|deadline|hạn chót|han chot|hạn cuối|han cuoi|by)\\s+(" + DATE_REGEX + ")(?:\\s+(\\d{1,2}(?:h|:\\d{2})(?:\\s*(?:sang|sáng|chieu|chiều|toi|tối|dem|đêm|am|pm))?))?$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // 4-tuple Patterns: Title, Start Time, Date, Duration (All 4 present)
    private static final Pattern TASK_TIME_DATE_DURATION_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(?:lúc|vào lúc|at\\s+)?(" + TIME_POINT_REGEX + ")\\s+(" + DATE_REGEX + ")\\s+(" + DURATION_REGEX + ")$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Pattern TASK_DATE_TIME_DURATION_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(" + DATE_REGEX + ")\\s+(?:lúc|vào lúc|at\\s+)?(" + TIME_POINT_REGEX + ")\\s+(" + DURATION_REGEX + ")$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Pattern TASK_DATE_TIME_TITLE_DURATION_PATTERN = Pattern.compile(
            "^(" + DATE_REGEX + ")\\s+(?:lúc|vào lúc|at\\s+)?(" + TIME_POINT_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)\\s+(" + DURATION_REGEX + ")$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Pattern TASK_TIME_DATE_TITLE_DURATION_PATTERN = Pattern.compile(
            "^(" + TIME_POINT_REGEX + ")\\s+(" + DATE_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)\\s+(" + DURATION_REGEX + ")$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Pattern TASK_DURATION_TIME_DATE_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(" + DURATION_REGEX + ")\\s+(?:lúc|vào lúc|at\\s+)?(" + TIME_POINT_REGEX + ")\\s+(" + DATE_REGEX + ")$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Pattern TASK_DURATION_DATE_TIME_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(" + DURATION_REGEX + ")\\s+(" + DATE_REGEX + ")\\s+(?:lúc|vào lúc|at\\s+)?(" + TIME_POINT_REGEX + ")$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Combined Task with Duration AND Date: "học tiếng Anh 1 tiếng tối nay", "team meeting 1 hour tomorrow afternoon"
    private static final Pattern TASK_DURATION_DATE_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(" + DURATION_REGEX + ")\\s+(" + DATE_REGEX + ")$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern TASK_DATE_DURATION_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(" + DATE_REGEX + ")\\s+(" + DURATION_REGEX + ")$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Task with Date at Start AND Duration in Middle: "Tối nay đi bách hóa xanh 1 tiếng mua rau"
    private static final Pattern TASK_DATE_START_DURATION_MID_PATTERN = Pattern.compile(
            "^(" + DATE_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)\\s+(" + DURATION_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Task with Duration in Middle AND Date at End: "Đi bách hóa xanh 1 tiếng mua rau tối nay"
    private static final Pattern TASK_DURATION_MID_DATE_END_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(" + DURATION_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)\\s+(" + DATE_REGEX + ")$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Task with Duration in the Middle: "Đi bách hóa xanh 1 tiếng mua rau", "Học tiếng Anh 2 tiếng chuẩn bị thi"
    private static final Pattern TASK_DURATION_MID_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(" + DURATION_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Task with Date in Middle: "Đi bách hóa xanh tối nay mua rau"
    private static final Pattern TASK_DATE_MID_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(" + DATE_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Task with Date First: "Sáng mai đi khám răng", "Tối nay học bài 2 tiếng"
    private static final Pattern TASK_DATE_TITLE_DURATION_PATTERN = Pattern.compile(
            "^(" + DATE_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)(?:\\s+(" + DURATION_REGEX + "))?$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Task with Duration First: "30 phút đọc sách", "1 tiếng dọn nhà tối nay"
    private static final Pattern TASK_DURATION_TITLE_DATE_PATTERN = Pattern.compile(
            "^(" + DURATION_REGEX + ")\\s+([\\p{L}\\d\\s.-]+?)(?:\\s+(" + DATE_REGEX + "))?$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Task with Duration: "Đọc sách 30 phút", "Review PR 15p", "Làm bài tập 1 tiếng rưỡi"
    private static final Pattern TASK_DURATION_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(" + DURATION_REGEX + ")$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Task with Date: "Đi siêu thị sáng mai", "Tập gym chiều nay", "Nộp bài tập thứ 6", "Làm bài khóa luận tối nay"
    private static final Pattern TASK_DATE_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]+?)\\s+(" + DATE_REGEX + ")$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Simple open task: "Mua sữa tươi", "Đi siêu thị", "Xem phim", "Học bài", "Check mail"
    private static final Pattern SIMPLE_TASK_PATTERN = Pattern.compile(
            "^[\\p{L}\\d\\s.-]{2,60}$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    @Autowired
    public FastPathParser(InputComplexityAnalyzer complexityAnalyzer) {
        this.complexityAnalyzer = complexityAnalyzer;
    }

    public FastPathParser() {
        this(new InputComplexityAnalyzer());
    }

    public Optional<AiExtraction> tryFastParse(String rawText) {
        return doFastParse(rawText).filter(ext -> isTitleClean(ext.title()));
    }

    private Optional<AiExtraction> doFastParse(String rawText) {
        if (rawText == null || rawText.isBlank()) return Optional.empty();

        String trimmed = rawText.trim();

        // 1. Multi-line checklist fast match
        if (trimmed.contains("\n")) {
            Optional<AiExtraction> checklistExtraction = tryParseMultiLineChecklist(trimmed);
            if (checklistExtraction.isPresent()) return checklistExtraction;
        }

        // 2. Pre-process metadata (urgent prefix/suffix, priority shortcuts !q1..q4, hashtag, notes, goal hint)
        ParsedMetadata meta = extractMetadata(trimmed);
        String cleaned = meta.cleanedText;

        // 3. Inline Checklist (e.g. "Dọn phòng: lau bàn, dọn giường, hút bụi", "Buy groceries: eggs, milk, bread")
        Optional<AiExtraction> inlineChecklist = tryParseInlineChecklist(cleaned, meta);
        if (inlineChecklist.isPresent()) return inlineChecklist;

        // 4. Recurring Events
        // 4a. Recurrence + Time + Title (+ Duration) (e.g. "Mỗi tối thứ 3 lúc 7 giờ chạy bộ", "Mỗi 2 4 6 lúc 18h đá bóng 2 tiếng")
        Matcher recTimeTitleMatcher = RECURRING_EVENT_REC_TIME_TITLE.matcher(cleaned);
        if (recTimeTitleMatcher.matches()) {
            String recurrence = recTimeTitleMatcher.group(1).trim();
            String time = recTimeTitleMatcher.group(2).trim();
            String title = cleanEventTitle(recTimeTitleMatcher.group(3));
            String duration = recTimeTitleMatcher.group(4) != null ? recTimeTitleMatcher.group(4).trim() : null;
            return Optional.of(buildExtractionWithRecurrence("Fast-path: Recurring event (rec-time-title)", "time_block", title, null, time, duration, recurrence, meta));
        }

        // 4b. Time + Recurrence + Title (+ Duration) (e.g. "Lúc 7h tối mỗi thứ 3 chạy bộ")
        Matcher timeRecTitleMatcher = RECURRING_EVENT_TIME_REC_TITLE.matcher(cleaned);
        if (timeRecTitleMatcher.matches()) {
            String time = timeRecTitleMatcher.group(1).trim();
            String recurrence = timeRecTitleMatcher.group(2).trim();
            String title = cleanEventTitle(timeRecTitleMatcher.group(3));
            String duration = timeRecTitleMatcher.group(4) != null ? timeRecTitleMatcher.group(4).trim() : null;
            return Optional.of(buildExtractionWithRecurrence("Fast-path: Recurring event (time-rec-title)", "time_block", title, null, time, duration, recurrence, meta));
        }

        // 4c. Title + Time + Recurrence (+ Duration) (e.g. "Chạy bộ 7h tối mỗi thứ 3")
        Matcher titleTimeRecMatcher = RECURRING_EVENT_TITLE_TIME_REC.matcher(cleaned);
        if (titleTimeRecMatcher.matches()) {
            String title = cleanEventTitle(titleTimeRecMatcher.group(1));
            String time = titleTimeRecMatcher.group(2).trim();
            String recurrence = titleTimeRecMatcher.group(3).trim();
            String duration = titleTimeRecMatcher.group(4) != null ? titleTimeRecMatcher.group(4).trim() : null;
            return Optional.of(buildExtractionWithRecurrence("Fast-path: Recurring event (title-time-rec)", "time_block", title, null, time, duration, recurrence, meta));
        }

        // 4d. Title + Recurrence + Time (+ Duration) (e.g. "Chạy bộ mỗi tối thứ 3 lúc 7h", "Uống thuốc mỗi ngày lúc 8h sáng")
        Matcher titleRecTimeMatcher = RECURRING_EVENT_TITLE_REC_TIME.matcher(cleaned);
        if (titleRecTimeMatcher.matches()) {
            String title = cleanEventTitle(titleRecTimeMatcher.group(1));
            String recurrence = titleRecTimeMatcher.group(2).trim();
            String time = titleRecTimeMatcher.group(3).trim();
            String duration = titleRecTimeMatcher.group(4) != null ? titleRecTimeMatcher.group(4).trim() : null;
            return Optional.of(buildExtractionWithRecurrence("Fast-path: Recurring event (title-rec-time)", "time_block", title, null, time, duration, recurrence, meta));
        }

        // 4e. Standalone Recurrence + Time (+ Duration) (e.g. "Mỗi tối thứ 3 lúc 7 giờ", "Mỗi 2 4 6 lúc 18h")
        Matcher recStandaloneTimeMatcher = RECURRING_STANDALONE_WITH_TIME.matcher(cleaned);
        if (recStandaloneTimeMatcher.matches()) {
            String recurrence = recStandaloneTimeMatcher.group(1).trim();
            String time = recStandaloneTimeMatcher.group(2).trim();
            String duration = recStandaloneTimeMatcher.group(3) != null ? recStandaloneTimeMatcher.group(3).trim() : null;
            return Optional.of(buildExtractionWithRecurrence("Fast-path: Recurring event (standalone-time)", "time_block", "Sự kiện định kỳ", null, time, duration, recurrence, meta));
        }

        // 4f. Title + Recurrence (+ Duration) [no time] (e.g. "Chạy bộ mỗi 2 4 6")
        Matcher titleRecMatcher = RECURRING_EVENT_TITLE_REC.matcher(cleaned);
        if (titleRecMatcher.matches()) {
            String title = cleanEventTitle(titleRecMatcher.group(1));
            String recurrence = titleRecMatcher.group(2).trim();
            String duration = titleRecMatcher.group(3) != null ? titleRecMatcher.group(3).trim() : null;
            return Optional.of(buildExtractionWithRecurrence("Fast-path: Recurring event (title-rec)", "time_block", title, null, null, duration, recurrence, meta));
        }

        // 4g. Recurrence + Title (+ Duration) [no time] (e.g. "Mỗi 2 4 6 đá bóng")
        Matcher recTitleMatcher = RECURRING_EVENT_REC_TITLE.matcher(cleaned);
        if (recTitleMatcher.matches()) {
            String recurrence = recTitleMatcher.group(1).trim();
            String title = cleanEventTitle(recTitleMatcher.group(2));
            String duration = recTitleMatcher.group(3) != null ? recTitleMatcher.group(3).trim() : null;
            return Optional.of(buildExtractionWithRecurrence("Fast-path: Recurring event (rec-title)", "time_block", title, null, null, duration, recurrence, meta));
        }

        // 4h. Standalone Recurrence only (e.g. "Mỗi 2 4 6", "Mỗi ngày")
        Matcher recStandaloneOnlyMatcher = RECURRING_STANDALONE_ONLY.matcher(cleaned);
        if (recStandaloneOnlyMatcher.matches()) {
            String recurrence = recStandaloneOnlyMatcher.group(1).trim();
            return Optional.of(buildExtractionWithRecurrence("Fast-path: Recurring event (standalone-only)", "time_block", "Sự kiện định kỳ", null, null, null, recurrence, meta));
        }

        // 5. Complexity check: route complex conditional/negated expressions to LLM
        ComplexityAnalysis analysis = complexityAnalyzer.analyze(cleaned);
        if (analysis.isComplex()) {
            return Optional.empty();
        }

        // 6. Clean Event with Range (e.g. "Đánh cầu 1-3 giờ chiều", "Họp team 9h - 10h sáng mai")
        Matcher eventRangeMatcher = CLEAN_EVENT_RANGE_PATTERN.matcher(cleaned);
        if (eventRangeMatcher.matches()) {
            String title = cleanEventTitle(eventRangeMatcher.group(1));
            String range = eventRangeMatcher.group(2).trim();
            String date = eventRangeMatcher.group(3) != null ? eventRangeMatcher.group(3).trim() : null;
            return Optional.of(buildExtraction("Fast-path: Calendar event range", "time_block", title, date, range, null, meta));
        }

        // 6b. Clean Event with Date First and Range (e.g. "Sáng mai 9h-11h họp team", "Chiều mai 1-3 giờ đánh cầu")
        Matcher eventDateRangeMatcher = CLEAN_EVENT_DATE_RANGE_PATTERN.matcher(cleaned);
        if (eventDateRangeMatcher.matches()) {
            String date = eventDateRangeMatcher.group(1).trim();
            String range = eventDateRangeMatcher.group(2).trim();
            String title = cleanEventTitle(eventDateRangeMatcher.group(3));
            return Optional.of(buildExtraction("Fast-path: Calendar event date and range", "time_block", title, date, range, null, meta));
        }

        // 7. Clean Deadline (e.g. "Nộp báo cáo trước 17h", "Nộp bài trước 17h chiều mai", "Nộp đồ án trước thứ 6")
        Matcher deadlineMatcher = CLEAN_DEADLINE_PATTERN.matcher(cleaned);
        if (deadlineMatcher.matches()) {
            String title = capitalizeFirst(deadlineMatcher.group(1).trim());
            String time = deadlineMatcher.group(2) != null ? deadlineMatcher.group(2).trim() : null;
            String date = deadlineMatcher.group(3) != null ? deadlineMatcher.group(3).trim() : null;
            if (time != null || date != null) {
                return Optional.of(buildExtraction("Fast-path: Deadline task", "deadline", title, date, time, null, meta));
            }
        }

        Matcher deadlineDateFirstMatcher = CLEAN_DEADLINE_DATE_FIRST.matcher(cleaned);
        if (deadlineDateFirstMatcher.matches()) {
            String title = capitalizeFirst(deadlineDateFirstMatcher.group(1).trim());
            String date = deadlineDateFirstMatcher.group(2) != null ? deadlineDateFirstMatcher.group(2).trim() : null;
            String time = deadlineDateFirstMatcher.group(3) != null ? deadlineDateFirstMatcher.group(3).trim() : null;
            return Optional.of(buildExtraction("Fast-path: Deadline task", "deadline", title, date, time, null, meta));
        }

        // 7c. Task/Event with Start Time, Date and Duration: "về quê 3 giờ chiều mai 4 tiếng", "đi bơi 5h chiều nay 1 tiếng"
        Matcher timeDateDurMatcher = TASK_TIME_DATE_DURATION_PATTERN.matcher(cleaned);
        if (timeDateDurMatcher.matches()) {
            String title = cleanEventTitle(timeDateDurMatcher.group(1));
            String time = timeDateDurMatcher.group(2).trim();
            String date = timeDateDurMatcher.group(3).trim();
            String duration = timeDateDurMatcher.group(4).trim();
            return Optional.of(buildExtraction("Fast-path: Task/Event with time, date and duration", "time_block", title, date, time, duration, meta));
        }

        // 7d. Task/Event with Date, Start Time and Duration: "về quê chiều mai 3h 4 tiếng", "dọn nhà sáng mai 8h 2 tiếng"
        Matcher dateTimeDurMatcher = TASK_DATE_TIME_DURATION_PATTERN.matcher(cleaned);
        if (dateTimeDurMatcher.matches()) {
            String title = cleanEventTitle(dateTimeDurMatcher.group(1));
            String date = dateTimeDurMatcher.group(2).trim();
            String time = dateTimeDurMatcher.group(3).trim();
            String duration = dateTimeDurMatcher.group(4).trim();
            return Optional.of(buildExtraction("Fast-path: Task/Event with date, time and duration", "time_block", title, date, time, duration, meta));
        }

        // 7e. Task/Event with Date, Start Time, Title and Duration: "Chiều mai 3h về quê 4 tiếng"
        Matcher dateTimeTitleDurMatcher = TASK_DATE_TIME_TITLE_DURATION_PATTERN.matcher(cleaned);
        if (dateTimeTitleDurMatcher.matches()) {
            String date = dateTimeTitleDurMatcher.group(1).trim();
            String time = dateTimeTitleDurMatcher.group(2).trim();
            String title = cleanEventTitle(dateTimeTitleDurMatcher.group(3));
            String duration = dateTimeTitleDurMatcher.group(4).trim();
            return Optional.of(buildExtraction("Fast-path: Task/Event with date first, time and duration", "time_block", title, date, time, duration, meta));
        }

        // 7f. Task/Event with Start Time, Date, Title and Duration: "3h chiều mai về quê 4 tiếng"
        Matcher timeDateTitleDurMatcher = TASK_TIME_DATE_TITLE_DURATION_PATTERN.matcher(cleaned);
        if (timeDateTitleDurMatcher.matches()) {
            String time = timeDateTitleDurMatcher.group(1).trim();
            String date = timeDateTitleDurMatcher.group(2).trim();
            String title = cleanEventTitle(timeDateTitleDurMatcher.group(3));
            String duration = timeDateTitleDurMatcher.group(4).trim();
            return Optional.of(buildExtraction("Fast-path: Task/Event with time first, date and duration", "time_block", title, date, time, duration, meta));
        }

        // 7g. Task/Event with Title, Duration, Start Time and Date: "về quê 4 tiếng lúc 3h chiều mai"
        Matcher durTimeDateMatcher = TASK_DURATION_TIME_DATE_PATTERN.matcher(cleaned);
        if (durTimeDateMatcher.matches()) {
            String title = cleanEventTitle(durTimeDateMatcher.group(1));
            String duration = durTimeDateMatcher.group(2).trim();
            String time = durTimeDateMatcher.group(3).trim();
            String date = durTimeDateMatcher.group(4).trim();
            return Optional.of(buildExtraction("Fast-path: Task/Event with duration, time and date", "time_block", title, date, time, duration, meta));
        }

        // 7h. Task/Event with Title, Duration, Date and Start Time: "về quê 4 tiếng chiều mai lúc 3h"
        Matcher durDateTimeMatcher = TASK_DURATION_DATE_TIME_PATTERN.matcher(cleaned);
        if (durDateTimeMatcher.matches()) {
            String title = cleanEventTitle(durDateTimeMatcher.group(1));
            String duration = durDateTimeMatcher.group(2).trim();
            String date = durDateTimeMatcher.group(3).trim();
            String time = durDateTimeMatcher.group(4).trim();
            return Optional.of(buildExtraction("Fast-path: Task/Event with duration, date and time", "time_block", title, date, time, duration, meta));
        }

        // 8. Clean Event with Start Time (e.g. "Khám răng lúc 8h sáng mai", "Ăn sáng ở macdonal 7 giờ sáng mai", "Họp phòng lúc 14h")
        Matcher eventStartMatcher = CLEAN_EVENT_START_PATTERN.matcher(cleaned);
        if (eventStartMatcher.matches()) {
            String title = cleanEventTitle(eventStartMatcher.group(1));
            String time = eventStartMatcher.group(2).trim();
            String date = eventStartMatcher.group(3) != null ? eventStartMatcher.group(3).trim() : null;
            return Optional.of(buildExtraction("Fast-path: Calendar event start", "time_block", title, date, time, null, meta));
        }

        // 8b. Event with Date First and Start Time (e.g. "Sáng mai 7 giờ ăn sáng ở macdonal", "Tối nay lúc 8h đi cafe")
        Matcher eventDateTimeMatcher = CLEAN_EVENT_DATE_TIME_PATTERN.matcher(cleaned);
        if (eventDateTimeMatcher.matches()) {
            String date = eventDateTimeMatcher.group(1).trim();
            String time = eventDateTimeMatcher.group(2).trim();
            String title = cleanEventTitle(eventDateTimeMatcher.group(3));
            return Optional.of(buildExtraction("Fast-path: Calendar event date and time", "time_block", title, date, time, null, meta));
        }

        // 8c. Event with Time First and Date (e.g. "7 giờ sáng mai ăn sáng ở macdonal", "8h tối nay đi cafe")
        Matcher eventTimeDateMatcher = CLEAN_EVENT_TIME_DATE_PATTERN.matcher(cleaned);
        if (eventTimeDateMatcher.matches()) {
            String time = eventTimeDateMatcher.group(1).trim();
            String date = eventTimeDateMatcher.group(2).trim();
            String title = cleanEventTitle(eventTimeDateMatcher.group(3));
            return Optional.of(buildExtraction("Fast-path: Calendar event time and date", "time_block", title, date, time, null, meta));
        }

        // 9. Combined Task with Duration AND Date (e.g. "học tiếng Anh 1 tiếng tối nay", "team meeting 1 hour tomorrow afternoon")
        Matcher durationDateMatcher = TASK_DURATION_DATE_PATTERN.matcher(cleaned);
        if (durationDateMatcher.matches()) {
            String title = capitalizeFirst(durationDateMatcher.group(1).trim());
            String duration = durationDateMatcher.group(2).trim();
            String date = durationDateMatcher.group(3).trim();
            return Optional.of(buildExtraction("Fast-path: Task with duration and date", "open_task", title, date, null, duration, meta));
        }

        Matcher dateDurationMatcher = TASK_DATE_DURATION_PATTERN.matcher(cleaned);
        if (dateDurationMatcher.matches()) {
            String title = capitalizeFirst(dateDurationMatcher.group(1).trim());
            String date = dateDurationMatcher.group(2).trim();
            String duration = dateDurationMatcher.group(3).trim();
            return Optional.of(buildExtraction("Fast-path: Task with date and duration", "open_task", title, date, null, duration, meta));
        }

        // 10. Task with Date at Start AND Duration in Middle: "Tối nay đi bách hóa xanh 1 tiếng mua rau"
        Matcher dateStartDurMidMatcher = TASK_DATE_START_DURATION_MID_PATTERN.matcher(cleaned);
        if (dateStartDurMidMatcher.matches()) {
            String date = dateStartDurMidMatcher.group(1).trim();
            String title = mergeTitle(dateStartDurMidMatcher.group(2), dateStartDurMidMatcher.group(4));
            String duration = dateStartDurMidMatcher.group(3).trim();
            return Optional.of(buildExtraction("Fast-path: Task with date first and duration in middle", "open_task", title, date, null, duration, meta));
        }

        // 11. Task with Date First: "Sáng mai đi khám răng", "Tối nay học bài 2 tiếng"
        Matcher dateTitleDurMatcher = TASK_DATE_TITLE_DURATION_PATTERN.matcher(cleaned);
        if (dateTitleDurMatcher.matches()) {
            String date = dateTitleDurMatcher.group(1).trim();
            String title = capitalizeFirst(dateTitleDurMatcher.group(2).trim());
            String duration = dateTitleDurMatcher.group(3) != null ? dateTitleDurMatcher.group(3).trim() : null;
            return Optional.of(buildExtraction("Fast-path: Task with date first", "open_task", title, date, null, duration, meta));
        }

        // 12. Task with Duration First: "30 phút đọc sách", "1 tiếng dọn nhà tối nay"
        Matcher durTitleDateMatcher = TASK_DURATION_TITLE_DATE_PATTERN.matcher(cleaned);
        if (durTitleDateMatcher.matches()) {
            String duration = durTitleDateMatcher.group(1).trim();
            String title = capitalizeFirst(durTitleDateMatcher.group(2).trim());
            String date = durTitleDateMatcher.group(3) != null ? durTitleDateMatcher.group(3).trim() : null;
            return Optional.of(buildExtraction("Fast-path: Task with duration first", "open_task", title, date, null, duration, meta));
        }

        // 13. Task with Duration in Middle AND Date at End: "Đi bách hóa xanh 1 tiếng mua rau tối nay"
        Matcher durMidDateEndMatcher = TASK_DURATION_MID_DATE_END_PATTERN.matcher(cleaned);
        if (durMidDateEndMatcher.matches()) {
            String title = mergeTitle(durMidDateEndMatcher.group(1), durMidDateEndMatcher.group(3));
            String duration = durMidDateEndMatcher.group(2).trim();
            String date = durMidDateEndMatcher.group(4).trim();
            return Optional.of(buildExtraction("Fast-path: Task with duration in middle and date at end", "open_task", title, date, null, duration, meta));
        }

        // 14. Task with Duration in Middle: "Đi bách hóa xanh 1 tiếng mua rau", "Học tiếng Anh 2 tiếng chuẩn bị thi"
        Matcher durMidMatcher = TASK_DURATION_MID_PATTERN.matcher(cleaned);
        if (durMidMatcher.matches()) {
            String title = mergeTitle(durMidMatcher.group(1), durMidMatcher.group(3));
            String duration = durMidMatcher.group(2).trim();
            return Optional.of(buildExtraction("Fast-path: Task with duration in middle", "open_task", title, null, null, duration, meta));
        }

        // 15. Task with Date in Middle: "Đi bách hóa xanh tối nay mua rau"
        Matcher dateMidMatcher = TASK_DATE_MID_PATTERN.matcher(cleaned);
        if (dateMidMatcher.matches()) {
            String title = mergeTitle(dateMidMatcher.group(1), dateMidMatcher.group(3));
            String date = dateMidMatcher.group(2).trim();
            return Optional.of(buildExtraction("Fast-path: Task with date in middle", "open_task", title, date, null, null, meta));
        }

        // 16. Task with Duration: "Đọc sách 30 phút", "Review PR 15p", "Làm bài tập 1 tiếng rưỡi"
        Matcher durationMatcher = TASK_DURATION_PATTERN.matcher(cleaned);
        if (durationMatcher.matches()) {
            String title = capitalizeFirst(durationMatcher.group(1).trim());
            String duration = durationMatcher.group(2).trim();
            return Optional.of(buildExtraction("Fast-path: Task with duration", "open_task", title, null, null, duration, meta));
        }

        // 17. Task with Date: "Đi siêu thị sáng mai", "Tập gym chiều nay", "Nộp bài tập thứ 6", "Làm bài khóa luận tối nay"
        Matcher dateMatcher = TASK_DATE_PATTERN.matcher(cleaned);
        if (dateMatcher.matches()) {
            String title = capitalizeFirst(dateMatcher.group(1).trim());
            String date = dateMatcher.group(2).trim();
            return Optional.of(buildExtraction("Fast-path: Task with date", "open_task", title, date, null, null, meta));
        }

        // 18. Simple open task (No temporal markers)
        String norm = DateResolver.normalizeVietnamese(cleaned.toLowerCase());
        if (!hasTemporalMarkers(norm) && SIMPLE_TASK_PATTERN.matcher(cleaned).matches()) {
            String title = capitalizeFirst(cleaned);
            return Optional.of(buildExtraction("Fast-path: Simple open task", "open_task", title, null, null, null, meta));
        }

        return Optional.empty();
    }

    private ParsedMetadata extractMetadata(String text) {
        String current = text;
        boolean isUrgent = false;
        Double customI = null;
        Double customU = null;
        String categoryHint = null;
        String goalHint = null;
        String notes = null;

        // Check urgent prefix
        Matcher urgentPrefix = URGENT_PREFIX.matcher(current);
        if (urgentPrefix.find()) {
            isUrgent = true;
            current = current.substring(urgentPrefix.end()).trim();
        }

        // Check urgent suffix
        Matcher urgentSuffix = URGENT_SUFFIX.matcher(current);
        if (urgentSuffix.find()) {
            isUrgent = true;
            current = current.substring(0, urgentSuffix.start()).trim();
        }

        // Check priority shortcuts (!q1..q4, !p1..p4, !high, !low, etc.)
        Matcher priorityMatcher = PRIORITY_SHORTCUT_PATTERN.matcher(current);
        if (priorityMatcher.find()) {
            String match = priorityMatcher.group().toLowerCase();
            if (match.contains("q1") || match.contains("p1") || match.contains("high") || match.contains("urgent") || match.contains("do_first")) {
                isUrgent = true;
                customI = 0.9;
                customU = 0.9;
            } else if (match.contains("q2") || match.contains("p2") || match.contains("schedule") || match.contains("important")) {
                customI = 0.9;
                customU = 0.1;
            } else if (match.contains("q3") || match.contains("p3") || match.contains("delegate")) {
                isUrgent = true;
                customI = 0.1;
                customU = 0.9;
            } else if (match.contains("q4") || match.contains("p4") || match.contains("low") || match.contains("eliminate")) {
                customI = 0.1;
                customU = 0.1;
            }
            current = current.replaceAll(Pattern.quote(priorityMatcher.group()), "").replaceAll("\\s+", " ").trim();
        }

        // Check notes
        Matcher noteMatcher = NOTE_PATTERN.matcher(current);
        if (noteMatcher.find()) {
            notes = noteMatcher.group(1).trim();
            current = current.substring(0, noteMatcher.start()).trim();
        }

        // Check goal explicit ("mục tiêu: ...", "goal: ...")
        Matcher goalMatcher = GOAL_EXPLICIT_PATTERN.matcher(current);
        if (goalMatcher.find()) {
            goalHint = goalMatcher.group(1).trim();
            current = current.substring(0, goalMatcher.start()).trim();
        }

        // Check @goal mention ("@Marathon", "@Project_A", @"Marathon 2026")
        Matcher atGoalMatcher = AT_GOAL_PATTERN.matcher(current);
        if (atGoalMatcher.find()) {
            String val = atGoalMatcher.group(1) != null ? atGoalMatcher.group(1) : atGoalMatcher.group(2);
            if (val != null && !val.isBlank()) {
                goalHint = val.trim();
            }
            current = current.replaceAll("@(?:\"[^\"]+\"|[\\p{L}\\d_-]+)", "").replaceAll("\\s+", " ").trim();
        }

        // Check hashtags ("#work", "#Project_cá_nhân", #"Project cá nhân")
        Matcher hashtagMatcher = HASHTAG_PATTERN.matcher(current);
        if (hashtagMatcher.find()) {
            String val = hashtagMatcher.group(1) != null ? hashtagMatcher.group(1) : hashtagMatcher.group(2);
            if (val != null && !val.isBlank()) {
                categoryHint = val.trim();
            }
            current = current.replaceAll("#(?:\"[^\"]+\"|[\\p{L}\\d_-]+)", "").replaceAll("\\s+", " ").trim();
        }

        return new ParsedMetadata(current, isUrgent, customI, customU, categoryHint, goalHint, notes);
    }

    private Optional<AiExtraction> tryParseInlineChecklist(String text, ParsedMetadata meta) {
        if (!text.contains(":") && !text.contains(";")) return Optional.empty();

        int colonIdx = text.indexOf(':');
        if (colonIdx <= 0 || colonIdx >= text.length() - 1) return Optional.empty();

        String header = text.substring(0, colonIdx).trim()
                .replaceAll("(?i)\\b(?:danh sách|checklist|list)\\b", "").trim();
        String itemsStr = text.substring(colonIdx + 1).trim();

        String[] parts = itemsStr.split("[,;]");
        if (parts.length < 2) return Optional.empty();

        List<String> items = new ArrayList<>();
        for (String part : parts) {
            String cleaned = part.trim().replaceFirst("^(?:[-*•+]|\\d+[.)])\\s*", "").trim();
            if (!cleaned.isBlank()) {
                items.add(capitalizeFirst(cleaned));
            }
        }

        if (items.size() < 2) return Optional.empty();

        String title = header.isBlank() ? "Danh sách việc" : capitalizeFirst(header);
        double iScore = meta.customI != null ? meta.customI : (meta.isUrgent ? 0.8 : 0.3);
        double uScore = meta.customU != null ? meta.customU : (meta.isUrgent ? 0.9 : 0.2);

        return Optional.of(new AiExtraction(
                "Fast-path: Inline checklist",
                "open_task",
                title,
                null,
                null,
                null,
                meta.categoryHint,
                meta.goalHint,
                meta.notes,
                items,
                false,
                null,
                iScore,
                uScore
        ));
    }

    private Optional<AiExtraction> tryParseMultiLineChecklist(String text) {
        String[] lines = text.split("\n");
        if (lines.length < 2) return Optional.empty();

        String header = lines[0].trim().replaceAll("[:;]$", "");
        if (header.isBlank()) return Optional.empty();

        List<String> items = new ArrayList<>();
        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isBlank()) continue;
            String cleaned = line.replaceFirst("^(?:[-*•+]|\\d+[.)])\\s*", "").trim();
            if (!cleaned.isBlank()) {
                items.add(capitalizeFirst(cleaned));
            }
        }

        if (items.isEmpty()) return Optional.empty();

        return Optional.of(new AiExtraction(
                "Fast-path: Multi-line checklist",
                "open_task",
                capitalizeFirst(header),
                null,
                null,
                null,
                null,
                null,
                null,
                items,
                false,
                null,
                0.3,
                0.2
        ));
    }

    private AiExtraction buildExtraction(
            String reasoning, String intent, String title,
            String dateExpr, String timeExpr, String durationExpr,
            ParsedMetadata meta
    ) {
        return buildExtractionWithRecurrence(reasoning, intent, title, dateExpr, timeExpr, durationExpr, null, meta);
    }

    private AiExtraction buildExtractionWithRecurrence(
            String reasoning, String intent, String title,
            String dateExpr, String timeExpr, String durationExpr,
            String recurrenceExpr,
            ParsedMetadata meta
    ) {
        double defaultI = "deadline".equals(intent) ? 0.6 : ("time_block".equals(intent) ? 0.5 : 0.3);
        double defaultU = "deadline".equals(intent) ? 0.7 : ("time_block".equals(intent) ? 0.5 : 0.2);

        double finalI = meta.customI != null ? meta.customI : (meta.isUrgent ? 0.8 : defaultI);
        double finalU = meta.customU != null ? meta.customU : (meta.isUrgent ? 0.9 : defaultU);

        return new AiExtraction(
                reasoning,
                intent,
                title,
                dateExpr,
                timeExpr,
                durationExpr,
                meta.categoryHint,
                meta.goalHint,
                meta.notes,
                null,
                false,
                recurrenceExpr,
                finalI,
                finalU
        );
    }

    private boolean hasTemporalMarkers(String norm) {
        return norm.matches(".*\\b(?:hom nay|mai|ngay mai|ngay mot|ngay kia|sang mai|chieu mai|toi mai|trua mai|dem mai|sang nay|chieu nay|toi nay|trua nay|dem nay|thu\\s*\\d|chu nhat|tuan sau|thang sau|gio|tieng|h|am|pm|phut|p|deadline|han chot|truoc|today|tomorrow|tonight|morning|afternoon|evening|night|hour|hours|min|mins|minute|minutes)\\b.*");
    }

    private String mergeTitle(String prefix, String suffix) {
        String p = prefix != null ? prefix.trim() : "";
        String s = suffix != null ? suffix.trim() : "";
        if (p.isEmpty()) return capitalizeFirst(s);
        if (s.isEmpty()) return capitalizeFirst(p);
        return capitalizeFirst(p + " " + s);
    }

    private static final Pattern UNPARSED_NUMBERED_DURATION = Pattern.compile(
            "\\b\\d+(?:[.,]\\d+)?\\s*(?:tieng|phut|ph|gio|h|mins?|minutes?|hours?)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern UNPARSED_RECURRENCE = Pattern.compile(
            "\\b(?:hang tuan|moi tuan|hang ngay|moi ngay|hang thang|moi thang|every day|every week|every month|moi\\s+[2-7]|moi\\s+toi|moi\\s+sang|moi\\s+chieu)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern UNPARSED_RELATIVE_DATE = Pattern.compile(
            "\\b(?:sang mai|chieu mai|toi mai|trua mai|dem mai|sang nay|chieu nay|toi nay|trua nay|dem nay|ngay mai|ngay mot|ngay kia|tomorrow|tonight)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern UNPARSED_DEADLINE = Pattern.compile(
            "\\b(?:truoc|deadline|han chot|by)\\s+(?:luc\\s*)?\\d{1,2}(?:h|:\\d{2}|\\s*gio|am|pm)\\b",
            Pattern.CASE_INSENSITIVE
    );

    public boolean isTitleClean(String title) {
        if (title == null || title.isBlank()) return false;
        String norm = DateResolver.normalizeVietnamese(title.toLowerCase());
        if (UNPARSED_NUMBERED_DURATION.matcher(norm).find()) return false;
        if (UNPARSED_RECURRENCE.matcher(norm).find()) return false;
        if (UNPARSED_RELATIVE_DATE.matcher(norm).find()) return false;
        if (UNPARSED_DEADLINE.matcher(norm).find()) return false;
        return true;
    }

    private String cleanEventTitle(String rawTitle) {
        if (rawTitle == null) return null;
        String t = rawTitle.trim().replaceAll("\\s+(?:lúc|vào lúc|vào|at)$", "").trim();
        return capitalizeFirst(t);
    }

    private String capitalizeFirst(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }

    private record ParsedMetadata(
        String cleanedText,
        boolean isUrgent,
        Double customI,
        Double customU,
        String categoryHint,
        String goalHint,
        String notes
    ) {}
}


