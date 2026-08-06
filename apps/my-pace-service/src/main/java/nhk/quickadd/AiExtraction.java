package nhk.quickadd;

import java.util.List;

/**
 * Internal DTO representing ONLY what the user explicitly expressed.
 * Never exposed outside the quickadd package.
 * Contains raw expressions — no computed values, no UUIDs.
 */
record AiExtraction(
        String intent,              // "time_block" | "deadline" | "open_task"
        String title,
        String dateExpression,      // e.g. "mai", "thứ 6", "cuối tuần"
        String timeExpression,      // e.g. "3h", "3 giờ chiều", "sáng"
        String durationExpression,  // e.g. "2 tiếng", "30 phút", "1h"
        String categoryHint,        // name hint only, never UUID
        String goalHint,            // name hint only, never UUID
        String notes,               // location, attendees, extra context
        List<String> checklists,    // raw checklist item strings
        boolean allDayHint,         // true when user said "cả ngày", "all day", "nghỉ"
        String recurrenceExpression // e.g. "hàng tuần", "hàng tuần thứ 2 thứ 4", null
) {}
