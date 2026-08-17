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
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
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
import java.util.Optional;
import java.util.UUID;

/**
 * Orchestrator for the QuickAdd pipeline.
 *
 * Pipeline:
 *   1. Pre-evaluate signals locally (Eisenhower lexicon & domain signals)
 *   2. Fast-Path evaluation with lightweight complexity analysis (< 1ms, 0 tokens)
 *   3. Versioned LRU Extraction Cache check (O(1) version retrieval)
 *   4. Groq LLM semantic extraction prompt -> Raw JSON
 *   5. Validation Layer (SchemaValidator -> SemanticValidator) -> AiExtraction
 *   6. Deterministic Resolvers (Duration, Date, Time, Category, Goal, Recurrence)
 *   7. Intent Classification (Task vs Event combining action verbs & external markers)
 *   8. Deterministic Eisenhower Scoring & Classification with DecisionTrace
 *   9. Assemble QuickAddResponse
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
    private final String systemPromptTemplate;

    // ── Cache & Versioning ────────────────────────────────────────────────────────
    private final QuickAddCache              quickAddCache;
    private final UserContextVersionService  userContextVersionService;

    // ── Validators ────────────────────────────────────────────────────────────────
    private final ExtractionSchemaValidator   schemaValidator;
    private final ExtractionSemanticValidator semanticValidator;

    // ── Dependencies ──────────────────────────────────────────────────────────────
    private final CategoryRepository  categoryRepository;
    private final GoalRepository      goalRepository;
    private final GroqClient          groqClient;
    private final String              apiKey;

    // ── Stateless resolvers & evaluators ─────────────────────────────────────────
    private final FastPathParser      fastPathParser;
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
            QuickAddCache quickAddCache,
            UserContextVersionService userContextVersionService,
            ExtractionSchemaValidator schemaValidator,
            ExtractionSemanticValidator semanticValidator,
            FastPathParser fastPathParser,
            @Value("${app.groq.api-key:}") String apiKey,
            @Value("${app.groq.model:llama-3.1-8b-instant}") String model,
            @Value("classpath:prompts/quickadd.txt") Resource promptResource
    ) {
        this(
                categoryRepository,
                goalRepository,
                eisenhowerClassifier,
                quickAddCache,
                userContextVersionService,
                schemaValidator,
                semanticValidator,
                apiKey,
                model,
                createOptimizedRestClient(),
                promptResource,
                fastPathParser
        );
    }

    private static RestClient createOptimizedRestClient() {
        var factory = new org.springframework.http.client.JdkClientHttpRequestFactory(
                java.net.http.HttpClient.newBuilder()
                        .version(java.net.http.HttpClient.Version.HTTP_2)
                        .connectTimeout(java.time.Duration.ofSeconds(3))
                        .build()
        );
        factory.setReadTimeout(java.time.Duration.ofSeconds(8));
        return RestClient.builder()
                .requestFactory(factory)
                .build();
    }

    /** Package-private constructor for unit testing with a mocked RestClient (bypasses fast-path by default). */
    QuickAddService(
            CategoryRepository categoryRepository,
            GoalRepository goalRepository,
            EisenhowerClassifier eisenhowerClassifier,
            String apiKey,
            String model,
            RestClient restClient
    ) {
        this(
                categoryRepository,
                goalRepository,
                eisenhowerClassifier,
                new QuickAddCache(),
                new UserContextVersionService(),
                new ExtractionSchemaValidator(),
                new ExtractionSemanticValidator(),
                apiKey,
                model,
                restClient,
                null,
                null
        );
    }

    /** Package-private constructor for unit testing with a mocked RestClient and custom prompt. */
    QuickAddService(
            CategoryRepository categoryRepository,
            GoalRepository goalRepository,
            EisenhowerClassifier eisenhowerClassifier,
            QuickAddCache quickAddCache,
            UserContextVersionService userContextVersionService,
            ExtractionSchemaValidator schemaValidator,
            ExtractionSemanticValidator semanticValidator,
            String apiKey,
            String model,
            RestClient restClient,
            Resource promptResource,
            FastPathParser fastPathParser
    ) {
        this.categoryRepository = categoryRepository;
        this.goalRepository     = goalRepository;
        this.eisenhowerClassifier = eisenhowerClassifier;
        this.quickAddCache       = quickAddCache != null ? quickAddCache : new QuickAddCache();
        this.userContextVersionService = userContextVersionService != null ? userContextVersionService : new UserContextVersionService();
        this.schemaValidator     = schemaValidator != null ? schemaValidator : new ExtractionSchemaValidator();
        this.semanticValidator   = semanticValidator != null ? semanticValidator : new ExtractionSemanticValidator();
        this.apiKey             = apiKey;
        this.groqClient         = new GroqClient(restClient, apiKey, model != null ? model : "llama-3.1-8b-instant");
        this.fastPathParser     = fastPathParser;
        try {
            if (promptResource != null && promptResource.exists()) {
                this.systemPromptTemplate = new String(FileCopyUtils.copyToByteArray(promptResource.getInputStream()), StandardCharsets.UTF_8);
            } else {
                Resource fallback = new ClassPathResource("prompts/quickadd.txt");
                this.systemPromptTemplate = fallback.exists() ? new String(FileCopyUtils.copyToByteArray(fallback.getInputStream()), StandardCharsets.UTF_8) : "";
            }
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to load prompt template", e);
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────────

    public QuickAddResponse parse(QuickAddRequest request, UUID userId, String timezone) {
        ZoneId        zoneId     = safeZoneId(timezone);
        ZonedDateTime now        = ZonedDateTime.now(zoneId);
        List<Category> categories = categoryRepository.findByUserIdOrderByNameAsc(userId);
        List<Goal>     goals      = goalRepository.findByUserIdAndStatus(userId, "In Progress");

        // 1. Pre-evaluate signals locally (Hybrid Pipeline)
        PreClassificationState preState = eisenhowerClassifier.preEvaluate(request.text(), goals, now);

        // 2. Fast-Path evaluation (Zero-LLM Latency for simple, unambiguous tasks)
        if (fastPathParser != null) {
            Optional<AiExtraction> fastExtraction = fastPathParser.tryFastParse(request.text());
            if (fastExtraction.isPresent()) {
                log.debug("QuickAdd fast-path hit for query: '{}'", request.text());
                AiExtraction validated = semanticValidator.validate(fastExtraction.get(), request.text());
                return resolve(validated, request.text(), categories, goals, now, preState);
            }
        }

        if (apiKey == null || apiKey.isBlank()) {
            throw new QuickAddExternalServiceException("GROQ_API_KEY is not configured");
        }

        // 3. Versioned LRU Cache Check (O(1) version retrieval)
        long contextVersion = userContextVersionService.getVersion(userId);
        String cacheKey = quickAddCache.buildKey(userId, contextVersion, request.text());
        Optional<AiExtraction> cachedExtraction = quickAddCache.get(cacheKey);

        AiExtraction extraction;
        if (cachedExtraction.isPresent()) {
            log.debug("QuickAdd cache hit for query: '{}'", request.text());
            extraction = cachedExtraction.get();
        } else {
            List<Map<String, Object>> messages = buildMessages(now, zoneId.getId(), categories, goals, request.text(), preState);
            try {
                extraction = callWithRetry(messages, request.text());
                quickAddCache.put(cacheKey, extraction);
            } catch (QuickAddExternalServiceException e) {
                log.warn("Groq AI extraction failed for query '{}', using minimal fallback: {}", request.text(), e.getMessage());
                throw e;
            }
        }

        return resolve(extraction, request.text(), categories, goals, now, preState);
    }

    /** Clear in-memory extraction cache (e.g. for maintenance or testing). */
    public void clearCache() {
        quickAddCache.clear();
        userContextVersionService.reset();
    }

    // ── Pipeline steps ────────────────────────────────────────────────────────────

    /** Calls Groq; on parse failure retries once at temperature 0.0. */
    private AiExtraction callWithRetry(List<Map<String, Object>> messages, String rawText) {
        try {
            return parseAndValidate(groqClient.complete(messages, 0.1), rawText);
        } catch (QuickAddParseException e) {
            return parseAndValidate(groqClient.complete(messages, 0.0), rawText);
        }
    }

    /**
     * Parses raw JSON string from Groq and applies Schema and Semantic validation.
     */
    private AiExtraction parseAndValidate(String content, String rawText) {
        try {
            JsonNode node = OBJECT_MAPPER.readTree(content);
            AiExtraction structural = schemaValidator.validate(node);
            return semanticValidator.validate(structural, rawText);
        } catch (QuickAddParseException e) {
            throw e;
        } catch (Exception e) {
            throw new QuickAddParseException("Failed to parse AI extraction", e);
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
        String timeContext = (extraction.dateExpression() != null ? extraction.dateExpression() + " " : "") + rawText;
        TimeResolver.TimeRange timeRange = timeResolver.resolveRange(extraction.timeExpression(), timeContext, now);
        LocalTime resolvedStartTime  = timeRange != null ? timeRange.startTime() : null;

        // Smart Date Rollover: If no date provided but time has passed today, move to tomorrow
        if (resolvedDate == null && resolvedStartTime != null) {
            if (resolvedStartTime.isBefore(now.toLocalTime())) {
                resolvedDate = now.toLocalDate().plusDays(1);
            } else {
                resolvedDate = now.toLocalDate();
            }
        }

        if (durationMinutes == null && timeRange != null && timeRange.durationMinutes() != null) {
            durationMinutes = timeRange.durationMinutes();
        } else if (durationMinutes == null && "time_block".equals(extraction.intent())) {
            durationMinutes = 60; // Default 1 hour for meetings/events if not specified
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

        // 2. Classify intent from resolved data & context
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

        // 6. Resolve recurrence (only meaningful for events per domain model)
        RecurrenceResult recurrence = "event".equals(type)
                ? recurrenceResolver.resolve(extraction.recurrenceExpression(), eventDate)
                : RecurrenceResult.none();

        // 7. Build checklists
        List<QuickAddChecklistResponse> checklists = buildChecklists(extraction.checklists());

        if (classification.trace() != null) {
            log.debug("QuickAdd decision trace for '{}': quadrant={}, importance={}, urgency={}, signals={}",
                    rawText, classification.quadrant(), classification.importanceScore(), classification.urgencyScore(), classification.trace().signals());
        }

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

    // ── Prompt builders ───────────────────────────────────────────────────────────

    private List<Map<String, Object>> buildMessages(
            ZonedDateTime now, String timezone,
            List<Category> categories, List<Goal> goals,
            String userText, PreClassificationState preState
    ) {
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPromptTemplate));
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
     * Representative few-shot examples covering task and event intent types.
     */
    private List<Map<String, Object>> buildFewShots() {
        return List.of(
                // 1. time_block — meeting with location and duration (Event)
                Map.of("role", "user", "content",
                        "Now: 2026-08-05 (Thứ 4)\nTimezone: Asia/Ho_Chi_Minh\nUser: \"Mai 3h chiều họp team backend ở phòng B2 khoảng tiếng rưỡi\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"time_block","title":"Họp team backend","dateExpression":"mai","timeExpression":"3h chiều","durationExpression":"tiếng rưỡi","categoryHint":null,"goalHint":null,"notes":"phòng B2","checklists":null,"isAllDay":false,"recurrenceExpression":null,"i":0.8,"u":0.8}"""),

                // 2. deadline — urgent task linked to a goal with relative date (Task)
                Map.of("role", "user", "content",
                        "Now: 2026-08-05 (Thứ 4)\nTimezone: Asia/Ho_Chi_Minh\nUser: \"3 ngày nữa nộp báo cáo đồ án trước 17h gấp\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"deadline","title":"Nộp báo cáo đồ án","dateExpression":"3 ngày nữa","timeExpression":"17h","durationExpression":null,"categoryHint":null,"goalHint":"đồ án","notes":null,"checklists":null,"isAllDay":false,"recurrenceExpression":null,"i":0.9,"u":0.9}"""),

                // 3. time_block — personal scheduled task (Task)
                Map.of("role", "user", "content",
                        "Now: 2026-08-05 (Thứ 4)\nTimezone: Asia/Ho_Chi_Minh\nUser: \"Tối nay 8h học tiếng Anh 1 tiếng\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"time_block","title":"Học tiếng Anh","dateExpression":"tối nay","timeExpression":"8h","durationExpression":"1 tiếng","categoryHint":null,"goalHint":null,"notes":null,"checklists":null,"isAllDay":false,"recurrenceExpression":null,"i":0.7,"u":0.4}"""),

                // 4. open_task — routine shopping list (Task with checklists)
                Map.of("role", "user", "content",
                        "Now: 2026-08-05 (Thứ 4)\nTimezone: Asia/Ho_Chi_Minh\nUser: \"Đi siêu thị mua sữa tươi, trứng gà, rau cải\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"open_task","title":"Đi siêu thị","dateExpression":null,"timeExpression":null,"durationExpression":null,"categoryHint":null,"goalHint":null,"notes":null,"checklists":["Mua sữa tươi","Mua trứng gà","Mua rau cải"],"isAllDay":false,"recurrenceExpression":null,"i":0.2,"u":0.3}"""),

                // 5. all-day event — holiday / day off (Event)
                Map.of("role", "user", "content",
                        "Now: 2026-08-05 (Thứ 4)\nTimezone: Asia/Ho_Chi_Minh\nUser: \"Ngày mai nghỉ lễ cả ngày\""),
                Map.of("role", "assistant", "content",
                        """
                        {"intent":"open_task","title":"Nghỉ lễ","dateExpression":"mai","timeExpression":null,"durationExpression":null,"categoryHint":null,"goalHint":null,"notes":null,"checklists":null,"isAllDay":true,"recurrenceExpression":null,"i":0.1,"u":0.1}""")
        );
    }

    // ── Small utilities ───────────────────────────────────────────────────────────

    private LocalDateTime buildDueDate(LocalDate date, LocalTime time) {
        if (date == null && time == null) return null;
        LocalDate effectiveDate = date != null ? date : LocalDate.now();
        LocalTime effectiveTime = time != null ? time : LocalTime.of(23, 59);
        return effectiveDate.atTime(effectiveTime);
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
