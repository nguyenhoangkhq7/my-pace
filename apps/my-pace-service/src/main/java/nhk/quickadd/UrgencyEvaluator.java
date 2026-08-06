package nhk.quickadd;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.List;

/**
 * Determines isUrgent from raw user text and resolved due date.
 * No AI — keyword matching + date comparison.
 *
 * Signal sources (either is sufficient):
 *   1. Urgency keywords present in the raw input
 *   2. Resolved dueDate is within the next 48 hours
 */
class UrgencyEvaluator {

    private static final List<String> URGENT_KEYWORDS = List.of(
            "gấp", "khẩn", "urgent", "asap", "trễ rồi", "chạy deadline",
            "hạn chót", "deadline", "phải xong hôm nay", "ngay lập tức",
            "gấp lên", "muộn rồi", "sắp hết hạn", "gần deadline"
    );

    boolean evaluate(String rawText, LocalDateTime resolvedDueDate, ZonedDateTime now) {
        if (rawText != null) {
            String lower = DateResolver.normalizeVietnamese(rawText.toLowerCase());
            for (String keyword : URGENT_KEYWORDS) {
                String normKeyword = DateResolver.normalizeVietnamese(keyword);
                if (lower.contains(normKeyword)) return true;
            }
        }
        if (resolvedDueDate != null) {
            LocalDateTime threshold = now.toLocalDateTime().plusHours(48);
            if (resolvedDueDate.isBefore(threshold)) return true;
        }
        return false;
    }
}
