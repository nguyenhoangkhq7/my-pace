package nhk.quickadd;

import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Classifies whether a parsed extraction represents a "task" or "event".
 *
 * Decision logic:
 *   1. allDayHint = true                                                → "event" (all-day event / holiday)
 *   2. Explicit deadline markers ("trước", "hạn chót", "deadline", ...)  → "task" (Task with dueDate)
 *   3. Purpose context masking (e.g. "in tài liệu cho cuộc họp" -> main verb is task action)
 *   4. Fixed Meeting / Calendar markers ("họp team", "khám bệnh", "phỏng vấn", ...) → "event"
 *   5. Intent = "open_task"                                             → "task"
 *   6. Time Range in time_block ("6am - 7am", "14:00 - 15:30", ...)     → "event" (Calendar Block)
 *   7. Personal Task Actions ("học", "code", "viết", "in tài liệu", ...) → "task" (Personal scheduled task)
 *   8. Specific Scheduled Start Time with time_block                    → "event" (Calendar event)
 *   9. Default                                                          → "task"
 */
@Component
public class IntentClassifier {

    private static final List<String> DEADLINE_MARKERS = List.of(
            "truoc", "trước", "han chot", "hạn chót", "deadline", "xong truoc", "xong trước",
            "tre nhat", "trễ nhất", "muon nhat", "muộn nhất", "by", "before", "due by"
    );

    private static final List<String> FIXED_EVENT_MARKERS = List.of(
            "hop", "họp", "meeting", "meet", "phong van", "phỏng vấn", "interview",
            "kham", "khám", "kham benh", "khám bệnh", "kham rang", "khám răng", "nha si", "nha sĩ", "bac si", "bác sĩ",
            "dam cuoi", "đám cưới", "wedding", "sinh nhat", "sinh nhật", "birthday",
            "xem phim", "cinema", "movie", "rap phim", "rạp phim",
            "truc ca", "trực ca", "truc dem", "trực đêm", "on call", "shift",
            "chuyen bay", "chuyến bay", "flight", "tau", "tàu", "xe lua", "xe khách",
            "hen voi", "hẹn với", "hen gap", "hẹn gặp", "appointment",
            "webinar", "workshop", "hoi thao", "hội thảo", "seminar",
            "di tiec", "đi tiệc", "an tiec", "ăn tiệc", "party"
    );

    private static final List<String> TASK_ACTION_MARKERS = List.of(
            "hoc", "học", "on thi", "ôn thi", "doc sach", "đọc sách",
            "code", "lap trinh", "lập trình", "fix bug", "review code",
            "viet", "viết", "lam", "làm", "nop", "nộp", "chuan bi", "chuẩn bị",
            "don dep", "dọn dẹp", "nau an", "nấu ăn", "nau com", "nấu cơm",
            "mua", "mua sắm", "shopping", "di cho", "đi chợ", "di sieu thi", "đi siêu thị",
            "gui email", "gửi email", "goi dien", "gọi điện", "goi khach", "gọi khách",
            "in", "in tai lieu", "in tài liệu", "soan", "soạn", "soan thao", "soạn thảo", "lam slide", "làm slide"
    );

    // Prepositional phrases indicating event context for a task (e.g., "cho cuộc họp", "cho phỏng vấn", "for the meeting")
    private static final Pattern PURPOSE_EVENT_PATTERN = Pattern.compile(
            "\\b(?:cho|phuc vu|phục vụ|chuan bi cho|chuẩn bị cho|for)\\s+(?:cuoc hop|cuộc họp|buoi hop|buổi họp|meeting|phong van|phỏng vấn|interview)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    private static final Pattern RANGE_PATTERN = Pattern.compile(
            "\\d{1,2}(?:h|:\\d{2}|am|pm)?\\s*(?:-|–|—|đến|den|to)\\s*\\d{1,2}(?:h|:\\d{2}|am|pm)?",
            Pattern.CASE_INSENSITIVE
    );

    public String classify(AiExtraction extraction, LocalTime resolvedStartTime, String rawText) {
        // 1. All-day event or Recurring event
        if (extraction.allDayHint() || (extraction.recurrenceExpression() != null && !extraction.recurrenceExpression().isBlank())) {
            return "event";
        }

        String normRaw = rawText != null ? DateResolver.normalizeVietnamese(rawText.toLowerCase()) : "";
        String intent = extraction.intent() != null ? extraction.intent().toLowerCase() : "";

        boolean hasDeadlineMarker = containsAny(normRaw, DEADLINE_MARKERS);
        boolean hasTaskActionMarker = containsAny(normRaw, TASK_ACTION_MARKERS);

        // Mask out purpose phrases like "cho cuộc họp" when evaluating whether the entire text is an event
        String textForEventCheck = PURPOSE_EVENT_PATTERN.matcher(normRaw).replaceAll(" ");
        boolean hasFixedEventMarker = containsAny(textForEventCheck, FIXED_EVENT_MARKERS);

        // 2. Explicit deadline markers ("trước 17h", "hạn chót", "deadline") or intent=deadline → task
        if (hasDeadlineMarker || "deadline".equalsIgnoreCase(intent)) {
            return "task";
        }

        // 3. If there is a clear task action and the event marker was only part of purpose clause ("in tài liệu cho cuộc họp") -> task
        if (hasTaskActionMarker && !hasFixedEventMarker) {
            return "task";
        }

        // 4. Fixed external event / appointment marker present → event
        if (hasFixedEventMarker) {
            return "event";
        }

        // 5. Open task intent (e.g. shopping list, general to-do) → task
        if ("open_task".equalsIgnoreCase(intent)) {
            return "task";
        }

        // 6. Explicit time range in time_block (e.g. "6am - 7am", "6h - 7h", "14:00 - 15:30", "9-11 giờ tối") → event
        boolean hasTimeRange = (rawText != null && RANGE_PATTERN.matcher(rawText).find())
                || (extraction.timeExpression() != null && RANGE_PATTERN.matcher(extraction.timeExpression()).find());
        if ("time_block".equalsIgnoreCase(intent) && hasTimeRange) {
            return "event";
        }

        // 7. Personal solo action with scheduled time (e.g. "học tiếng Anh 1 tiếng", "code backend") → task
        if (hasTaskActionMarker) {
            return "task";
        }

        // 8. If time_block intent is present with a resolved start time and not a solo task action → event
        if ("time_block".equalsIgnoreCase(intent) && resolvedStartTime != null) {
            return "event";
        }

        // Default to task
        return "task";
    }

    public boolean isDeadlineIntent(String rawText, String intent) {
        String normRaw = rawText != null ? DateResolver.normalizeVietnamese(rawText.toLowerCase()) : "";
        boolean hasDeadlineMarker = containsAny(normRaw, DEADLINE_MARKERS);
        return hasDeadlineMarker || "deadline".equalsIgnoreCase(intent);
    }

    private boolean containsAny(String text, List<String> markers) {
        if (text == null || text.isBlank()) return false;
        for (String m : markers) {
            String norm = DateResolver.normalizeVietnamese(m);
            if (text.matches(".*\\b" + Pattern.quote(norm) + "\\b.*")) {
                return true;
            }
        }
        return false;
    }
}
