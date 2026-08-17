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
 *
 * Checks input complexity via InputComplexityAnalyzer first before pattern matching.
 */
@Component
public class FastPathParser {

    private final InputComplexityAnalyzer complexityAnalyzer;

    // Pattern for simple open task with no time or date (e.g. "Mua sữa tươi", "Đi chợ mua cá")
    private static final Pattern SIMPLE_TASK_PATTERN = Pattern.compile(
            "^(?:di|đi|lam|làm|mua|don|dọn|nau|nấu|doc|đọc|viet|viết|code|fix|test|gui|gửi|tap|tập|on|ôn|soan|soạn|chuan bi|chuẩn bị)\\s+[\\p{L}\\d\\s.-]{2,50}$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Matches clean deadlines: "Nộp báo cáo trước 17h", "Gửi slide trước 5h chiều"
    private static final Pattern CLEAN_DEADLINE_PATTERN = Pattern.compile(
            "^([\\p{L}\\d\\s.-]{2,40})\\s+(?:truoc|trước)\\s+(\\d{1,2}(?:h|:\\d{2})(?:\\s*(?:sang|sáng|chieu|chiều|toi|tối|dem|đêm|am|pm))?)$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );

    // Matches clean events with time range: "Họp team 9h - 10h sáng mai", "Họp phòng 14:00 - 15:30 mai"
    private static final Pattern CLEAN_EVENT_RANGE_PATTERN = Pattern.compile(
            "^(hop|họp|meeting)\\s+([\\p{L}\\d\\s.-]{2,30})\\s+(\\d{1,2}(?:h|:\\d{2})\\s*(?:-|đến|–)\\s*\\d{1,2}(?:h|:\\d{2})(?:\\s*(?:sang|sáng|chieu|chiều|toi|tối|am|pm))?)\\s*(mai|ngay mai|ngày mai|hom nay|hôm nay|toi nay|tối nay|sang mai|sáng mai)?$",
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
        if (rawText == null || rawText.isBlank()) return Optional.empty();

        String trimmed = rawText.trim();

        // 1. Multi-line checklist fast match
        if (trimmed.contains("\n")) {
            Optional<AiExtraction> checklistExtraction = tryParseMultiLineChecklist(trimmed);
            if (checklistExtraction.isPresent()) return checklistExtraction;
        }

        // 2. Complexity check: route complex expressions to LLM
        ComplexityAnalysis analysis = complexityAnalyzer.analyze(trimmed);
        if (analysis.isComplex()) {
            return Optional.empty();
        }

        String norm = DateResolver.normalizeVietnamese(trimmed.toLowerCase());

        // 3. Pattern: Simple task with no temporal expressions
        if (!hasTemporalMarkers(norm) && SIMPLE_TASK_PATTERN.matcher(norm).matches()) {
            String title = capitalizeFirst(trimmed);
            return Optional.of(new AiExtraction(
                    "Fast-path: Simple open task",
                    "open_task",
                    title,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    false,
                    null,
                    0.3,
                    0.1
            ));
        }

        // 4. Pattern: Clean Task Deadline ("Nộp báo cáo trước 17h")
        Matcher deadlineMatcher = CLEAN_DEADLINE_PATTERN.matcher(trimmed);
        if (deadlineMatcher.matches()) {
            String actionPart = deadlineMatcher.group(1).trim();
            String timePart = deadlineMatcher.group(2).trim();
            return Optional.of(new AiExtraction(
                    "Fast-path: Deadline task",
                    "deadline",
                    capitalizeFirst(actionPart),
                    null,
                    timePart,
                    null,
                    null,
                    null,
                    null,
                    null,
                    false,
                    null,
                    0.6,
                    0.7
            ));
        }

        // 5. Pattern: Clean Meeting with Range ("Họp team 9h - 10h sáng mai")
        Matcher eventMatcher = CLEAN_EVENT_RANGE_PATTERN.matcher(trimmed);
        if (eventMatcher.matches()) {
            String keyword = eventMatcher.group(1).trim();
            String name = eventMatcher.group(2).trim();
            String range = eventMatcher.group(3).trim();
            String date = eventMatcher.group(4) != null ? eventMatcher.group(4).trim() : null;

            String title = capitalizeFirst(keyword + " " + name);
            return Optional.of(new AiExtraction(
                    "Fast-path: Calendar event",
                    "time_block",
                    title,
                    date,
                    range,
                    null,
                    null,
                    null,
                    null,
                    null,
                    false,
                    null,
                    0.5,
                    0.5
            ));
        }

        return Optional.empty();
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
                items.add(cleaned);
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

    private boolean hasTemporalMarkers(String norm) {
        return norm.matches(".*\\b(?:hom nay|mai|ngay mai|ngay mot|ngay kia|thu\\s*\\d|chu nhat|tuan sau|thang sau|gio|h|am|pm|phut|p|deadline|han chot|truoc)\\b.*");
    }

    private String capitalizeFirst(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }
}
