package nhk.quickadd;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
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
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Orchestrator for the QuickAdd pipeline.
 *
 * Pipeline:
 *   1. Check extraction cache (saves 100% LLM tokens & 0ms latency on duplicate queries)
 *   2. Call Groq with an upgraded semantic extraction prompt -> AiExtraction
 *   3. Resolve raw expressions to typed values (deterministic Java)
 *   4. Classify intent (task vs event) from resolved data
 *   5. Evaluate urgency and importance (enhanced keyword rules)
 *   6. Resolve recurrence
 *   7. Assemble QuickAddResponse
 */
@Slf4j
@Service
public class QuickAddService {

    // ── Formatters ────────────────────────────────────────────────────────────────
    private static final DateTimeFormatter DT_FORMATTER   = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    private static final DateTimeFormatter DATE_FORMATTER  = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter TIME_FORMATTER  = DateTimeFormatter.ofPattern("HH:mm");
    private static final ObjectMapper      OBJECT_MAPPER   = new ObjectMapper();

    // ── System prompt ─────────────────────────────────────────────────────────────
    private static final String SYSTEM_PROMPT = """
            You are an expert Vietnamese & English NLP extractor for a smart productivity app.
            Extract key information explicitly stated or clearly implied by the user. Do NOT calculate dates or guess numeric IDs.
            Respond ONLY with a single strict JSON object. No markdown fences, no explanatory text.

            OUTPUT SCHEMA:
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

            EXTRACTION RULES:
            - intent:
              - "time_block": Scheduled meetings, appointments, specific start times, or calendar time blocks (e.g. "Họp team 3h chiều", "Tối nay tìm việc lúc 7 giờ", "Đi khám răng 8h sáng", "Chạy bộ 6am - 7am"). Whenever the user states when an activity starts or happens ("lúc", "vào lúc", "từ... đến", "at"), set intent to "time_block".
              - "deadline": Tasks with a completion deadline or due date constraint (e.g. "Nộp báo cáo trước 17h", "Hạn chót thứ 6", "Làm bài tập xong trước trưa mai", "by 5pm").
              - "open_task": General tasks, to-do items, shopping lists without a specific start time or fixed calendar block.
            - title: Natural, informative title containing the core action and object/target. Strip out date/time expressions, duration phrases, and explicit recurrence phrases. Keep essential context (e.g. "Họp với sếp Nam về dự án Alpha", "Đi siêu thị mua đồ ăn", "Chạy bộ 5km ở công viên", "Nộp báo cáo đồ án").
            - dateExpression: Copy the exact date phrase (e.g. "mai", "thứ 6", "3 ngày nữa", "thứ 4 tuần sau", "ngày 15/8", "cuối tuần", "ngày mốt"). null if absent.
            - timeExpression: Copy the exact time phrase (e.g. "3h", "3 giờ chiều", "8 rưỡi sáng", "8h kém 15", "đầu giờ chiều", "17:00"). null if absent.
            - durationExpression: Copy the exact duration phrase (e.g. "2 tiếng", "tiếng rưỡi", "nửa tiếng", "45p", "1h30", "khoảng 1 tiếng"). null if absent.
            - categoryHint:
              - If user explicitly mentions a category, hashtag, or abbreviation (e.g. "#Daily", "việc công ty", "KLTN"), match that category.
              - If not explicitly mentioned, SEMANTICALLY INFER the most suitable category from the provided "Categories" list based on the nature of the activity (e.g. "nấu ăn", "quét nhà", "mua sắm", "nấu cơm" -> "Daily" / "Personal"; "họp", "fix bug", "báo cáo", "review code" -> "Work"; "ôn thi", "đọc sách", "bài tập" -> "Study"; "chạy bộ", "khám răng", "gym" -> "Health").
              - Use the EXACT category name from the provided Categories list. Return null if no category fits.
            - goalHint:
              - Goal or project title from the provided "Goals (active)" list if explicitly mentioned or if the activity clearly belongs to that project/goal. Use the EXACT goal title from the list. Return null if no goal fits.
            - notes: Specific supplementary details (e.g. room number, address/location, attendee names, URL links, conditions) not part of the main title. null if absent.
            - checklists: Array of distinct item strings ONLY when the user explicitly lists sub-items (e.g. "mua sữa, trứng, bánh mì" -> ["Mua sữa", "Mua trứng", "Mua bánh mì"]). null otherwise.
            - isAllDay: true ONLY when user explicitly states "cả ngày", "all day", "nghỉ lễ", "cả buổi". false otherwise.
            - recurrenceExpression: Copy the exact repetition phrase (e.g., "hàng tuần thứ 2, thứ 4, thứ 6", "mỗi ngày", "mỗi thứ 3"). null if absent.
            - Never hallucinate non-existent fields. Return null for missing fields.
            """;

    // ── In-Memory Extraction Cache for Cost & Latency Optimization ─────────────────
    private final Map<String, AiExtraction> extractionCache = new ConcurrentHashMap<>();
    private static final int MAX_CACHE_SIZE = 1000;

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
    private final RecurrenceResolver  recurrenceResolver  = new RecurrenceResolver();
    private final EisenhowerClassifier eisenhowerClassifier;

    // ── Constructors ──────────────────────────────────────────────────────────────

    @Autowired
    public QuickAddService(
            CategoryRepository categoryRepository,
            GoalRepository goalRepository,
            EisenhowerClassifier eisenhowerClassifier,
            @Value("${app.groq.api-key:}") String apiKey,
            @Value("${app.groq.model:qwen/qwen3.6-27b}") String model
    ) {
        this(categoryRepository, goalRepository, eisenhowerClassifier, apiKey, model, RestClient.builder().build());
    }

    /** Package-private constructor for unit testing with a mocked RestClient. */
    QuickAddService(
            CategoryRepository categoryRepository,
            GoalRepository goalRepository,
            EisenhowerClassifier eisenhowerClassifier,
            String apiKey,
            String model,
            RestClient restClient
    ) {
        this.categoryRepository = categoryRepository;
        this.goalRepository     = goalRepository;
        this.eisenhowerClassifier = eisenhowerClassifier;
        this.apiKey             = apiKey;
        this.groqClient         = new GroqClient(restClient, apiKey, model != null ? model : "qwen/qwen3.6-27b");
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

        // 1. Pre-evaluate signals locally (Hybrid Pipeline)
        PreClassificationState preState = eisenhowerClassifier.preEvaluate(request.text(), goals, now);

        // 2. Build cache key based on normalized text + categories/goals signature (cross-day persistent)
        String cacheKey = buildCacheKey(request.text(), categories, goals);
        AiExtraction extraction = extractionCache.get(cacheKey);

        if (extraction != null) {
            log.debug("QuickAdd cache hit for query: '{}'", request.text());
        } else {
            List<Map<String, Object>> messages = buildMessages(now, zoneId.getId(), categories, goals, request.text(), preState);
            extraction = callWithRetry(messages);

            // Put into in-memory cache
            if (extractionCache.size() >= MAX_CACHE_SIZE) {
                extractionCache.clear();
            }
            extractionCache.put(cacheKey, extraction);
        }

        return resolve(extraction, request.text(), categories, goals, now, preState);
    }

    /** Clear in-memory extraction cache (e.g. for maintenance or testing). */
    public void clearCache() {
        extractionCache.clear();
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
            ZonedDateTime now,
            PreClassificationState preState
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
        String type = intentClassifier.classify(extraction, resolvedStartTime, rawText);

        // 3. Compute type-specific date/time fields
        boolean   isAllDay  = "event".equals(type) && extraction.allDayHint();
        LocalDate eventDate = "event".equals(type) ? resolvedDate : null;
        LocalDateTime dueDate = "task".equals(type) ? buildDueDate(resolvedDate, resolvedStartTime) : null;

        // 4. For all-day events: clear startTime/endTime
        LocalTime effectiveStart = (isAllDay) ? null : resolvedStartTime;
        LocalTime effectiveEnd   = (isAllDay) ? null : resolvedEndTime;

        // 5. Evaluate business signals deterministically + AI semantic hints
        ClassificationResult classification = eisenhowerClassifier.postEvaluate(
                preState, extraction.i(), extraction.u(), dueDate, now
        );

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
                classification.isUrgent(),
                classification.isImportant(),
                classification.quadrant(),
                classification.importanceScore(),
                classification.urgencyScore(),
                classification.reason(),
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
            Double iScore = readDoubleOptional(node, "i");
            Double uScore = readDoubleOptional(node, "u");

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
                    readText(node, "recurrenceExpression"),
                    iScore,
                    uScore
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
            String userText, PreClassificationState preState
    ) {
        String dynamicSystemPrompt = SYSTEM_PROMPT;
        
        // Dynamically add schema for i and u if confidence is low
        if (!preState.isImportanceConfident() || !preState.isUrgencyConfident()) {
            StringBuilder schemaAdditions = new StringBuilder();
            StringBuilder ruleAdditions = new StringBuilder("\n            - SCORING RULES (0.0 to 1.0):");
            
            if (!preState.isImportanceConfident()) {
                schemaAdditions.append(",\n              \"i\": float");
                ruleAdditions.append("\n              - \"i\": Importance score. 1.0 = High-leverage, compounding value, deep work, finance, health. 0.0 = Routine chores, gossip, game, low value.");
            }
            if (!preState.isUrgencyConfident()) {
                schemaAdditions.append(",\n              \"u\": float");
                ruleAdditions.append("\n              - \"u\": Urgency score. 1.0 = Immediate deadline, crisis, today. 0.0 = No pressure, distant future.");
            }
            
            dynamicSystemPrompt = dynamicSystemPrompt.replace(
                    "\"recurrenceExpression\": string | null\n            }",
                    "\"recurrenceExpression\": string | null" + schemaAdditions.toString() + "\n            }"
            );
            dynamicSystemPrompt += ruleAdditions.toString();
        }

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", dynamicSystemPrompt));
        messages.addAll(buildFewShots());
        messages.add(Map.of("role", "user", "content", buildUserPrompt(now, timezone, categories, goals, userText, preState)));
        return messages;
    }

    private String buildUserPrompt(
            ZonedDateTime now, String timezone,
            List<Category> categories, List<Goal> goals,
            String text, PreClassificationState preState
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("Now: ").append(now.toLocalDate().toString())
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
        
        if (!preState.domainSignals().isEmpty()) {
            sb.append("Detected Domain Signals: ")
                    .append(String.join(", ", preState.domainSignals().stream().map(nhk.quickadd.lexicon.CategoryMatch::category).distinct().toList()))
                    .append("\n");
        }

        sb.append("\nUser: \"").append(text.replace("\"", "\\\"")).append("\"");
        return sb.toString();
    }

    /**
     * Representative few-shot examples covering all intent types.
     */
    private List<Map<String, Object>> buildFewShots() {
        return List.of(
                // 1. time_block — meeting with location and duration (Q1/Q2)
                Map.of("role", "user", "content",
                        "Now: 2026-08-05 (Thứ 4)\nTimezone: Asia/Ho_Chi_Minh\nUser: \"Mai 3h chiều họp team backend ở phòng B2 khoảng tiếng rưỡi\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"time_block","title":"Họp team backend","dateExpression":"mai","timeExpression":"3h chiều","durationExpression":"tiếng rưỡi","categoryHint":null,"goalHint":null,"notes":"phòng B2","checklists":null,"isAllDay":false,"recurrenceExpression":null,"isUrgent":true,"isImportant":true}"""),

                // 2. deadline — urgent task linked to a goal with relative date (Q1)
                Map.of("role", "user", "content",
                        "Now: 2026-08-05 (Thứ 4)\nTimezone: Asia/Ho_Chi_Minh\nUser: \"3 ngày nữa nộp báo cáo đồ án trước 17h gấp\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"deadline","title":"Nộp báo cáo đồ án","dateExpression":"3 ngày nữa","timeExpression":"17h","durationExpression":null,"categoryHint":null,"goalHint":"đồ án","notes":null,"checklists":null,"isAllDay":false,"recurrenceExpression":null,"isUrgent":true,"isImportant":true}"""),

                // 3. open_task — routine shopping / chore list (Q3)
                Map.of("role", "user", "content",
                        "Now: 2026-08-05 (Thứ 4)\nTimezone: Asia/Ho_Chi_Minh\nUser: \"Đi siêu thị mua sữa tươi, trứng gà, rau cải\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"open_task","title":"Đi siêu thị","dateExpression":null,"timeExpression":null,"durationExpression":null,"categoryHint":null,"goalHint":null,"notes":null,"checklists":["Mua sữa tươi","Mua trứng gà","Mua rau cải"],"isAllDay":false,"recurrenceExpression":null,"isUrgent":true,"isImportant":false}"""),

                // 4. all-day event — holiday / day off
                Map.of("role", "user", "content",
                        "Now: 2026-08-05 (Thứ 4)\nTimezone: Asia/Ho_Chi_Minh\nUser: \"Ngày mai nghỉ lễ cả ngày\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"open_task","title":"Nghỉ lễ","dateExpression":"mai","timeExpression":null,"durationExpression":null,"categoryHint":null,"goalHint":null,"notes":null,"checklists":null,"isAllDay":true,"recurrenceExpression":null,"isUrgent":false,"isImportant":false}"""),

                // 5. recurring time_block — weekly standup with Vietnamese time
                Map.of("role", "user", "content",
                        "Now: 2026-08-05 (Thứ 4)\nTimezone: Asia/Ho_Chi_Minh\nUser: \"Họp standup lúc 8 rưỡi sáng hàng tuần thứ 2, thứ 4, thứ 6\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"time_block","title":"Họp standup","dateExpression":null,"timeExpression":"8 rưỡi sáng","durationExpression":null,"categoryHint":null,"goalHint":null,"notes":null,"checklists":null,"isAllDay":false,"recurrenceExpression":"hàng tuần thứ 2, thứ 4, thứ 6","isUrgent":true,"isImportant":true}""")
        );
    }

    private String buildCacheKey(String rawText, List<Category> categories, List<Goal> goals) {
        String normText = (rawText != null) ? rawText.trim().toLowerCase() : "";
        int categoriesHash = (categories != null) ? categories.stream().map(Category::getName).sorted().toList().hashCode() : 0;
        int goalsHash = (goals != null) ? goals.stream().map(Goal::getTitle).sorted().toList().hashCode() : 0;
        return normText + "|" + categoriesHash + "|" + goalsHash;
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

    private Boolean readBooleanOptional(JsonNode node, String field) {
        JsonNode f = node.get(field);
        if (f == null || f.isNull() || !f.isBoolean()) return null;
        return f.asBoolean();
    }

    private Double readDoubleOptional(JsonNode node, String field) {
        JsonNode f = node.get(field);
        if (f == null || f.isNull() || !f.isNumber()) return null;
        return f.asDouble();
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
