package nhk.quickadd;

import java.time.LocalTime;
import java.util.List;

/**
 * Classifies whether a parsed extraction represents a "task" or "event".
 *
 * Decision logic:
 *   1. allDayHint = true                      → "event" (all-day event)
 *   2. Deadline markers present ("trước", "hạn chót", "deadline", "by") → "task" (with dueDate)
 *   3. Specific start time resolved ("lúc 7h", "3h chiều", range)      → "event" (calendar timeblock)
 *   4. Start time markers present ("lúc", "vào lúc", "at")             → "event"
 *   5. Explicit time_block intent without deadline markers            → "event"
 *   6. Default                                                        → "task"
 */
class IntentClassifier {

    private static final List<String> DEADLINE_MARKERS = List.of(
            "truoc", "trước", "han chot", "hạn chót", "deadline", "xong truoc", "xong trước",
            "tre nhat", "trễ nhất", "muon nhat", "muộn nhất", "by", "before", "due by"
    );

    private static final List<String> START_TIME_MARKERS = List.of(
            "luc", "lúc", "vao luc", "vào lúc", "bat dau", "bắt đầu", "at", "starts at"
    );

    String classify(AiExtraction extraction, LocalTime resolvedStartTime, String rawText) {
        // 1. All-day event: user explicitly said "cả ngày", "nghỉ lễ", "all day" etc.
        if (extraction.allDayHint()) return "event";

        String normRaw = rawText != null ? DateResolver.normalizeVietnamese(rawText.toLowerCase()) : "";
        String intent = extraction.intent() != null ? extraction.intent().toLowerCase() : "";

        boolean hasDeadlineMarker = containsAny(normRaw, DEADLINE_MARKERS);
        boolean hasStartTimeMarker = containsAny(normRaw, START_TIME_MARKERS);

        // 2. If user explicitly provided deadline markers ("trước 17h", "hạn chót", "deadline"), it is a task
        if (hasDeadlineMarker) {
            return "task";
        }

        // 3. If intent was explicitly classified as deadline (and no start time marker), treat as task
        if ("deadline".equalsIgnoreCase(intent) && !hasStartTimeMarker) {
            return "task";
        }

        // 4. If a specific start time was resolved (e.g. "tối nay tìm việc lúc 7 giờ", "3h chiều", "6am - 7am")
        if (resolvedStartTime != null || hasStartTimeMarker || "time_block".equalsIgnoreCase(intent)) {
            return "event";
        }

        return "task";
    }

    private boolean containsAny(String text, List<String> markers) {
        if (text == null || text.isBlank()) return false;
        for (String m : markers) {
            String norm = DateResolver.normalizeVietnamese(m);
            if (text.contains(norm)) return true;
        }
        return false;
    }
}
