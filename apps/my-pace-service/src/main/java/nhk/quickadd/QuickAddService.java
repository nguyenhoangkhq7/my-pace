package nhk.quickadd;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import nhk.category.Category;
import nhk.category.CategoryRepository;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Orchestrator for the QuickAdd pipeline.
 *
 * Pipeline:
 *   1. Call Groq with a lean extraction-only prompt  → AiExtraction
 *   2. Resolve raw expressions to typed values (deterministic Java)
 *   3. Classify intent (task vs event) from resolved data
 *   4. Evaluate urgency and importance (keyword rules)
 *   5. Resolve recurrence
 *   6. Assemble QuickAddResponse
 *
 * Business logic is distributed into dedicated resolver/evaluator classes.
 * This service contains NO business logic beyond orchestration.
 */
@Service
public class QuickAddService {

    // ── Formatters ────────────────────────────────────────────────────────────────
    private static final DateTimeFormatter DT_FORMATTER   = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    private static final DateTimeFormatter DATE_FORMATTER  = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter TIME_FORMATTER  = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter NOW_FORMATTER   = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    private static final ObjectMapper      OBJECT_MAPPER   = new ObjectMapper();

    // ── System prompt ─────────────────────────────────────────────────────────────
    private static final String SYSTEM_PROMPT = """
            You are a Vietnamese NLP extractor for a productivity app.
            Extract ONLY what the user explicitly expressed. Do NOT calculate. Do NOT infer. Do NOT guess IDs.
            Respond with a single strict JSON object. No markdown, no code fences, no explanation.

            OUTPUT FORMAT:
            {
              "intent": "time_block" | "deadline" | "open_task",
              "title": string,
              "dateExpression": string | null,
              "timeExpression": string | null,
              "durationExpression": string | null,
              "categoryHint": string | null,
              "goalHint": string | null,
              "notes": string | null,
              "checklists": [string] | null,
              "isAllDay": boolean,
              "recurrenceExpression": string | null
            }

            FIELD RULES:
            - intent: "time_block" if user states a start time. "deadline" if only a date/deadline. "open_task" otherwise.
            - title: core action only. Strip time, date, duration, urgency words, location, and recurrence from title.
            - dateExpression: copy EXACTLY as user said ("mai", "thứ 6", "cuối tuần"). null if absent.
            - timeExpression: copy EXACTLY as user said ("3h", "3 giờ chiều", "sáng"). null if absent.
            - durationExpression: copy EXACTLY as user said ("2 tiếng", "30 phút", "1h"). null if absent.
            - categoryHint: category name or abbreviation (e.g. "KLTN" for "Khóa luận tốt nghiệp", "CNTT") ONLY if clearly mentioned by user. Prefer exact category name from Categories list if recognizable. null otherwise.
            - goalHint: goal or project name or abbreviation ONLY if clearly mentioned by user. Prefer exact goal title from Goals list if recognizable. null otherwise.
            - notes: location, attendees, conditions, or context NOT included in the title. null if absent.
            - checklists: array of strings ONLY when user explicitly lists sub-items. null otherwise.
            - isAllDay: true ONLY when user explicitly says "cả ngày", "all day", "nghỉ lễ", "cả buổi", or similar whole-day markers. false otherwise.
            - recurrenceExpression: copy EXACTLY what user said about repetition ("hàng tuần", "mỗi ngày", "hàng tuần thứ 2 thứ 4 thứ 6"). null if no recurrence.
            - If a field is not present in the user's input → null (or false for isAllDay). Never invent values.
            """;

    // ── Dependencies ──────────────────────────────────────────────────────────────
    private final CategoryRepository  categoryRepository;
    private final GoalRepository      goalRepository;
    private final GroqClient          groqClient;
    private final String              apiKey;

    // ── Stateless resolvers & evaluators ─────────────────────────────────────────
    private final DurationResolver    durationResolver    = new DurationResolver();
    private final DateResolver        dateResolver        = new DateResolver();
    private final TimeResolver        timeResolver        = new TimeResolver();
    private final CategoryResolver    categoryResolver    = new CategoryResolver();
    private final GoalResolver        goalResolver        = new GoalResolver();
    private final IntentClassifier    intentClassifier    = new IntentClassifier();
    private final UrgencyEvaluator    urgencyEvaluator    = new UrgencyEvaluator();
    private final ImportanceEvaluator importanceEvaluator = new ImportanceEvaluator();
    private final RecurrenceResolver  recurrenceResolver  = new RecurrenceResolver();

    // ── Constructors ──────────────────────────────────────────────────────────────

    @Autowired
    public QuickAddService(
            CategoryRepository categoryRepository,
            GoalRepository goalRepository,
            @Value("${app.groq.api-key:}") String apiKey,
            @Value("${app.groq.model:llama-3.1-8b-instant}") String model
    ) {
        this(categoryRepository, goalRepository, apiKey, model, RestClient.builder().build());
    }

    /** Package-private constructor for unit testing with a mocked RestClient. */
    QuickAddService(
            CategoryRepository categoryRepository,
            GoalRepository goalRepository,
            String apiKey,
            String model,
            RestClient restClient
    ) {
        this.categoryRepository = categoryRepository;
        this.goalRepository     = goalRepository;
        this.apiKey             = apiKey;
        this.groqClient         = new GroqClient(restClient, apiKey, model);
    }

    // ── Public API ────────────────────────────────────────────────────────────────

    public QuickAddResponse parse(QuickAddRequest request, UUID userId, String timezone) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new QuickAddExternalServiceException("GROQ_API_KEY is not configured");
        }

        ZoneId        zoneId     = safeZoneId(timezone);
        ZonedDateTime now        = ZonedDateTime.now(zoneId);
        List<Category> categories = categoryRepository.findByUserIdOrderByNameAsc(userId);
        List<Goal>     goals      = goalRepository.findByUserIdAndStatus(userId, "In Progress");

        List<Map<String, Object>> messages = buildMessages(now, zoneId.getId(), categories, goals, request.text());
        AiExtraction extraction = callWithRetry(messages);

        return resolve(extraction, request.text(), categories, goals, now);
    }

    // ── Pipeline steps ────────────────────────────────────────────────────────────

    /** Calls Groq; on parse failure retries once at temperature 0.0. */
    private AiExtraction callWithRetry(List<Map<String, Object>> messages) {
        try {
            return parseExtraction(groqClient.complete(messages, 0.1));
        } catch (QuickAddParseException e) {
            return parseExtraction(groqClient.complete(messages, 0.0));
        }
    }

    /**
     * Runs all resolvers and evaluators, then assembles the final response.
     * This is the deterministic business logic layer.
     */
    private QuickAddResponse resolve(
            AiExtraction extraction,
            String rawText,
            List<Category> categories,
            List<Goal> goals,
            ZonedDateTime now
    ) {
        Integer   durationMinutes    = durationResolver.resolve(extraction.durationExpression());
        LocalDate resolvedDate       = dateResolver.resolve(extraction.dateExpression(), now);
        if (resolvedDate == null) {
            // Fallback: users often include day markers inside time phrases, e.g. "8 giờ tối nay".
            resolvedDate = dateResolver.resolve(extraction.timeExpression(), now);
        }
        TimeResolver.TimeRange timeRange = timeResolver.resolveRange(extraction.timeExpression(), extraction.dateExpression());
        LocalTime resolvedStartTime  = timeRange != null ? timeRange.startTime() : null;
        if (durationMinutes == null && timeRange != null && timeRange.durationMinutes() != null) {
            durationMinutes = timeRange.durationMinutes();
        }
        LocalTime resolvedEndTime    = (timeRange != null && timeRange.endTime() != null)
                ? timeRange.endTime()
                : timeResolver.resolveEndTime(resolvedStartTime, durationMinutes);
        UUID      goalId             = goalResolver.resolve(extraction.goalHint(), goals);
        UUID      categoryId         = categoryResolver.resolve(extraction.categoryHint(), categories);
        if (goalId != null) {
            categoryId = goals.stream()
                    .filter(g -> g.getId().equals(goalId) && g.getCategoryId() != null)
                    .map(Goal::getCategoryId)
                    .findFirst()
                    .orElse(categoryId);
        }

        // 2. Classify intent from resolved data (NOT from LLM's literal "type" field)
        String type = intentClassifier.classify(extraction, resolvedStartTime);

        // 3. Compute type-specific date/time fields
        boolean   isAllDay  = "event".equals(type) && extraction.allDayHint();
        LocalDate eventDate = "event".equals(type) ? resolvedDate : null;
        LocalDateTime dueDate = "task".equals(type) ? buildDueDate(resolvedDate, resolvedStartTime) : null;

        // 4. For all-day events: clear startTime/endTime
        LocalTime effectiveStart = (isAllDay) ? null : resolvedStartTime;
        LocalTime effectiveEnd   = (isAllDay) ? null : resolvedEndTime;

        // 5. Evaluate business signals deterministically
        boolean isUrgent    = urgencyEvaluator.evaluate(rawText, dueDate, now);
        boolean isImportant = importanceEvaluator.evaluate(extraction.title(), extraction.categoryHint());

        // 6. Resolve recurrence (only meaningful for events)
        RecurrenceResult recurrence = "event".equals(type)
                ? recurrenceResolver.resolve(extraction.recurrenceExpression(), eventDate)
                : RecurrenceResult.none();

        // 7. Build checklists
        List<QuickAddChecklistResponse> checklists = buildChecklists(extraction.checklists());

        return new QuickAddResponse(
                type,
                extraction.title(),
                durationMinutes,
                isUrgent,
                isImportant,
                dueDate    != null ? dueDate.format(DT_FORMATTER)       : null,
                eventDate  != null ? eventDate.format(DATE_FORMATTER)    : null,
                effectiveStart != null && "event".equals(type) ? effectiveStart.format(TIME_FORMATTER) : null,
                effectiveEnd   != null && "event".equals(type) ? effectiveEnd.format(TIME_FORMATTER)   : null,
                categoryId,
                goalId,
                extraction.notes(),
                checklists.isEmpty() ? null : checklists,
                isAllDay,
                recurrence.recurrenceType(),
                recurrence.recurrenceDays(),
                recurrence.recurrenceEndDate() != null ? recurrence.recurrenceEndDate().format(DATE_FORMATTER) : null
        );
    }

    // ── Extraction parsing ────────────────────────────────────────────────────────

    /**
     * Parses raw JSON string from Groq into an AiExtraction.
     * Structural validation only — no business logic here.
     */
    private AiExtraction parseExtraction(String content) {
        try {
            JsonNode node = OBJECT_MAPPER.readTree(content);

            String title = readText(node, "title");
            if (title == null || title.isBlank()) {
                throw new QuickAddParseException("AI failed to extract title");
            }

            List<String> checklists = new ArrayList<>();
            JsonNode checklistsNode = node.get("checklists");
            if (checklistsNode != null && checklistsNode.isArray()) {
                for (JsonNode item : checklistsNode) {
                    String text = item.isTextual() ? item.asText(null) : readText(item, "title");
                    if (text != null && !text.isBlank()) checklists.add(text);
                }
            }

            boolean allDayHint = readBoolean(node, "isAllDay");

            return new AiExtraction(
                    readText(node, "intent"),
                    title,
                    readText(node, "dateExpression"),
                    readText(node, "timeExpression"),
                    readText(node, "durationExpression"),
                    readText(node, "categoryHint"),
                    readText(node, "goalHint"),
                    readText(node, "notes"),
                    checklists.isEmpty() ? null : checklists,
                    allDayHint,
                    readText(node, "recurrenceExpression")
            );
        } catch (QuickAddParseException e) {
            throw e;
        } catch (Exception e) {
            throw new QuickAddParseException("Failed to parse AI extraction", e);
        }
    }

    // ── Prompt builders ───────────────────────────────────────────────────────────

    private List<Map<String, Object>> buildMessages(
            ZonedDateTime now, String timezone,
            List<Category> categories, List<Goal> goals,
            String userText
    ) {
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        messages.addAll(buildFewShots());
        messages.add(Map.of("role", "user", "content", buildUserPrompt(now, timezone, categories, goals, userText)));
        return messages;
    }

    private String buildUserPrompt(
            ZonedDateTime now, String timezone,
            List<Category> categories, List<Goal> goals,
            String text
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("Now: ").append(now.toLocalDateTime().format(NOW_FORMATTER))
                .append(" (").append(dayOfWeekLabel(now.getDayOfWeek())).append(")\n");
        sb.append("Timezone: ").append(timezone).append("\n");

        if (!categories.isEmpty()) {
            sb.append("Categories: ")
                    .append(String.join(", ", categories.stream().map(Category::getName).toList()))
                    .append("\n");
        }
        if (!goals.isEmpty()) {
            sb.append("Goals (active): ")
                    .append(String.join(", ", goals.stream().map(Goal::getTitle).toList()))
                    .append("\n");
        }

        sb.append("\nUser: \"").append(text.replace("\"", "\\\"")).append("\"");
        return sb.toString();
    }

    /**
     * Five representative few-shot examples covering all intent types.
     * Snapshots use a fixed "Now" so they don't drift.
     */
    private List<Map<String, Object>> buildFewShots() {
        return List.of(
                // 1. time_block — meeting with location and duration
                Map.of("role", "user", "content",
                        "Now: 2026-08-05T09:00:00 (Thứ 4)\nUser: \"Mai 3h họp team backend ở B2 khoảng 2 tiếng\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"time_block","title":"Họp team backend","dateExpression":"mai","timeExpression":"3h","durationExpression":"2 tiếng","categoryHint":null,"goalHint":null,"notes":"B2","checklists":null,"isAllDay":false,"recurrenceExpression":null}"""),

                // 2. deadline — urgent task linked to a goal
                Map.of("role", "user", "content",
                        "Now: 2026-08-05T09:00:00 (Thứ 4)\nUser: \"Cuối tuần nộp báo cáo đồ án gấp\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"deadline","title":"Nộp báo cáo đồ án","dateExpression":"cuối tuần","timeExpression":null,"durationExpression":null,"categoryHint":null,"goalHint":"đồ án","notes":null,"checklists":null,"isAllDay":false,"recurrenceExpression":null}"""),

                // 3. open_task — shopping list with checklists
                Map.of("role", "user", "content",
                        "Now: 2026-08-05T09:00:00 (Thứ 4)\nUser: \"Đi siêu thị mua sữa, trứng, rau cải\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"open_task","title":"Đi siêu thị","dateExpression":null,"timeExpression":null,"durationExpression":null,"categoryHint":null,"goalHint":null,"notes":null,"checklists":["Mua sữa","Mua trứng","Mua rau cải"],"isAllDay":false,"recurrenceExpression":null}"""),

                // 4. all-day event — holiday / day off
                Map.of("role", "user", "content",
                        "Now: 2026-08-05T09:00:00 (Thứ 4)\nUser: \"Ngày mai nghỉ lễ cả ngày\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"open_task","title":"Nghỉ lễ","dateExpression":"mai","timeExpression":null,"durationExpression":null,"categoryHint":null,"goalHint":null,"notes":null,"checklists":null,"isAllDay":true,"recurrenceExpression":null}"""),

                // 5. recurring time_block — weekly standup
                Map.of("role", "user", "content",
                        "Now: 2026-08-05T09:00:00 (Thứ 4)\nUser: \"Họp standup lúc 9h sáng hàng tuần thứ 2, thứ 4, thứ 6\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"time_block","title":"Họp standup","dateExpression":null,"timeExpression":"9h sáng","durationExpression":null,"categoryHint":null,"goalHint":null,"notes":null,"checklists":null,"isAllDay":false,"recurrenceExpression":"hàng tuần thứ 2, thứ 4, thứ 6"}""")
        );
    }

    // ── Small utilities ───────────────────────────────────────────────────────────

    private LocalDateTime buildDueDate(LocalDate date, LocalTime time) {
        if (date == null) return null;
        return date.atTime(time != null ? time : LocalTime.of(23, 59));
    }

    private List<QuickAddChecklistResponse> buildChecklists(List<String> items) {
        if (items == null || items.isEmpty()) return List.of();
        List<QuickAddChecklistResponse> result = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            String title = items.get(i);
            if (title != null && !title.isBlank()) {
                result.add(new QuickAddChecklistResponse(title, false, i));
            }
        }
        return result;
    }

    private String readText(JsonNode node, String field) {
        JsonNode f = node.get(field);
        if (f == null || f.isNull()) return null;
        String value = f.asText(null);
        return value != null && !value.isBlank() ? value : null;
    }

    private boolean readBoolean(JsonNode node, String field) {
        JsonNode f = node.get(field);
        return f != null && !f.isNull() && f.asBoolean(false);
    }

    private ZoneId safeZoneId(String timezone) {
        try {
            return ZoneId.of(timezone);
        } catch (Exception e) {
            return ZoneId.of("UTC");
        }
    }

    private String dayOfWeekLabel(DayOfWeek day) {
        return switch (day) {
            case MONDAY    -> "Thứ 2";
            case TUESDAY   -> "Thứ 3";
            case WEDNESDAY -> "Thứ 4";
            case THURSDAY  -> "Thứ 5";
            case FRIDAY    -> "Thứ 6";
            case SATURDAY  -> "Thứ 7";
            case SUNDAY    -> "Chủ nhật";
        };
    }
}
