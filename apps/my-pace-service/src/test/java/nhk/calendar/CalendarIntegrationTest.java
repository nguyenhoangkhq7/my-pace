package nhk.calendar;

import nhk.BaseIntegrationTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import nhk.category.Category;
import nhk.category.CategoryRepository;
import nhk.common.GlobalExceptionHandler;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import nhk.planning.DailyPlanRepository;
import nhk.planning.DailyPlanTaskRepository;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.timeblock.TaskTimeBlock;
import nhk.timeblock.TaskTimeBlockRepository;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserDetailsCustom;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CalendarIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private FixedEventController fixedEventController;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private FixedEventRepository fixedEventRepository;

    @Autowired
    private FixedEventExceptionRepository fixedEventExceptionRepository;

    @Autowired
    private DailyCheckinRepository dailyCheckinRepository;

    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private DailyPlanRepository dailyPlanRepository;

    @Autowired
    private DailyPlanTaskRepository dailyPlanTaskRepository;

    @Autowired
    private TaskTimeBlockRepository taskTimeBlockRepository;

    private MockMvc mockMvcUserA;
    private MockMvc mockMvcUserB;
    private ObjectMapper objectMapper;

    private User testUserA;
    private User testUserB;
    private Category testCategoryA;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        // Create & persist User A
        testUserA = new User();
        testUserA.setEmail("userA@example.com");
        testUserA.setPasswordHash("hashed_password");
        testUserA.setFullName("User A");
        testUserA.setRole(Role.USER);
        testUserA.setTimezone("UTC");
        testUserA.setWakeTime(LocalTime.of(7, 0));
        testUserA.setSleepTime(LocalTime.of(23, 0));
        testUserA.setBufferPct(20);
        testUserA = userRepository.save(testUserA);

        // Create & persist User B
        testUserB = new User();
        testUserB.setEmail("userB@example.com");
        testUserB.setPasswordHash("hashed_password");
        testUserB.setFullName("User B");
        testUserB.setRole(Role.USER);
        testUserB.setTimezone("UTC");
        testUserB.setWakeTime(LocalTime.of(8, 0));
        testUserB.setSleepTime(LocalTime.of(22, 0));
        testUserB.setBufferPct(15);
        testUserB = userRepository.save(testUserB);

        testCategoryA = new Category();
        testCategoryA.setUserId(testUserA.getId());
        testCategoryA.setName("User A Category");
        testCategoryA = categoryRepository.save(testCategoryA);

        mockMvcUserA = createMockMvcForUser(testUserA);
        mockMvcUserB = createMockMvcForUser(testUserB);
    }

    private MockMvc createMockMvcForUser(User user) {
        HandlerMethodArgumentResolver principalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new UserDetailsCustom(user);
            }
        };

        return MockMvcBuilders.standaloneSetup(fixedEventController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(principalResolver)
                .build();
    }

    @Nested
    @DisplayName("1. Security & Cross-User Authorization Integration Tests")
    class AuthorizationIntegrationTests {

        @Test
        @DisplayName("User B attempting to modify User A's fixed event should return 403 Forbidden")
        void crossUserAccess_AccessDenied() throws Exception {
            // Save event for User A directly in DB
            FixedEvent eventUserA = FixedEvent.builder()
                    .user(testUserA)
                    .title("User A Private Event")
                    .eventDate(LocalDate.of(2026, 8, 5))
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(10, 0))
                    .recurrenceType("NONE")
                    .availabilityStatus("BUSY")
                    .build();
            eventUserA = fixedEventRepository.save(eventUserA);

            FixedEventRequest updateReq = new FixedEventRequest(
                    "Hacked Title", null, LocalTime.of(9, 0), LocalTime.of(10, 0),
                    false, LocalDate.of(2026, 8, 5), "NONE", null, null, null, "BUSY"
            );

            // User B calls PUT for User A's event -> Exception handler converts AccessDeniedException to 403
            mockMvcUserB.perform(put("/api/calendar/events/{id}", eventUserA.getId())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateReq)))
                    .andExpect(status().isForbidden());

            // Verify event title in DB was NOT changed
            FixedEvent dbEvent = fixedEventRepository.findById(eventUserA.getId()).orElseThrow();
            assertThat(dbEvent.getTitle()).isEqualTo("User A Private Event");
        }
    }

    @Nested
    @DisplayName("2. Fixed Event Full End-to-End Integration Lifecycle")
    class FixedEventLifecycleTests {

        @Test
        @DisplayName("End-to-End: Create -> Query Range -> Patch Exception -> Soft Delete -> Split -> Cascade Delete")
        void fullEventLifecycle_EndToEnd() throws Exception {
            LocalDate startDate = LocalDate.of(2026, 8, 3); // Monday

            // 1. Create a DAILY recurring event via API
            FixedEventRequest createReq = new FixedEventRequest(
                    "Morning Gym", "Cardio session", LocalTime.of(7, 30), LocalTime.of(8, 30),
                    false, startDate, "DAILY", null, null, testCategoryA.getId(), "BUSY"
            );

            String createResult = mockMvcUserA.perform(post("/api/calendar/events")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(createReq)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.title").value("Morning Gym"))
                    .andReturn().getResponse().getContentAsString();

            FixedEventResponse createResp = objectMapper.readValue(createResult, FixedEventResponse.class);
            UUID eventId = createResp.seriesId();

            // Verify entity created in real H2 database
            assertThat(fixedEventRepository.findById(eventId)).isPresent();

            // 2. Query expanded occurrences for 3 days (2026-08-03 to 2026-08-05)
            mockMvcUserA.perform(get("/api/calendar/events")
                            .param("start", "2026-08-03")
                            .param("end", "2026-08-05"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(3));

            // 3. Patch single occurrence exception for 2026-08-04
            LocalDate overrideDate = LocalDate.of(2026, 8, 4);
            FixedEventExceptionRequest patchReq = new FixedEventExceptionRequest(
                    "Heavy Leg Day", "Extra heavy", LocalTime.of(8, 0), LocalTime.of(9, 30),
                    null, false, null, "BUSY"
            );

            mockMvcUserA.perform(patch("/api/calendar/events/{id}/exceptions/{date}", eventId, overrideDate)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(patchReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("Heavy Leg Day"))
                    .andExpect(jsonPath("$.startTime").value("08:00:00"));

            // Verify exception entity saved in H2 DB
            assertThat(fixedEventExceptionRepository.findByFixedEventIdAndOccurrenceDate(eventId, overrideDate)).isPresent();

            // 4. Soft delete single occurrence for 2026-08-05
            LocalDate deleteDate = LocalDate.of(2026, 8, 5);
            mockMvcUserA.perform(delete("/api/calendar/events/{id}/exceptions/{date}", eventId, deleteDate))
                    .andExpect(status().isNoContent());

            // 5. Query expanded range -> 2026-08-03 (Original), 2026-08-04 (Heavy Leg Day), 2026-08-05 (Soft Deleted, Omitted)
            mockMvcUserA.perform(get("/api/calendar/events")
                            .param("start", "2026-08-03")
                            .param("end", "2026-08-05"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].title").value("Morning Gym"))
                    .andExpect(jsonPath("$[1].title").value("Heavy Leg Day"));

            // 6. Delete entire series via API
            mockMvcUserA.perform(delete("/api/calendar/events/{id}", eventId))
                    .andExpect(status().isNoContent());

            // Verify entity removed from H2 DB
            assertThat(fixedEventRepository.findById(eventId)).isEmpty();
        }
    }

    @Nested
    @DisplayName("3. Available Time End-to-End Integration Tests")
    class AvailableTimeIntegrationTests {

        @Test
        @DisplayName("Should query database for user settings and events, calculating union-intervals correctly")
        void getAvailableTime_Integration() throws Exception {
            LocalDate targetDate = LocalDate.of(2026, 8, 10);

            // Save fixed busy event 1: 09:00 - 11:00 in H2 DB
            FixedEvent e1 = FixedEvent.builder()
                    .user(testUserA)
                    .title("Event 1")
                    .eventDate(targetDate)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(11, 0))
                    .recurrenceType("NONE")
                    .availabilityStatus("BUSY")
                    .build();
            fixedEventRepository.save(e1);

            // Save overlapping busy event 2: 10:00 - 12:00 in H2 DB
            FixedEvent e2 = FixedEvent.builder()
                    .user(testUserA)
                    .title("Event 2")
                    .eventDate(targetDate)
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(12, 0))
                    .recurrenceType("NONE")
                    .availabilityStatus("BUSY")
                    .build();
            fixedEventRepository.save(e2);

            // User A settings: wake 07:00, sleep 23:00, buffer 20% -> window 07:15 to 23:00 (945 mins)
            // Blocked = 180 mins (09:00 to 12:00). Remaining = 765 mins. Available = 612 mins.
            mockMvcUserA.perform(get("/api/calendar/available-time")
                            .param("date", "2026-08-10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.workingWindowMinutes").value(945))
                    .andExpect(jsonPath("$.blockedMinutes").value(180))
                    .andExpect(jsonPath("$.availableMinutes").value(612))
                    .andExpect(jsonPath("$.blockedIntervals[0].startTime").value("09:00"))
                    .andExpect(jsonPath("$.blockedIntervals[0].endTime").value("12:00"));
        }
    }

    @Nested
    @DisplayName("4. Daily Check-in & Auto Goal Task Scheduling Integration Tests")
    class DailyCheckinIntegrationTests {

        @Test
        @DisplayName("Checkin should save DB record, auto-create Goal tasks, and schedule time blocks around fixed events")
        void checkin_AutoSchedule_Integration() throws Exception {
            LocalDate checkinDate = LocalDate.of(2026, 8, 3); // Monday (1)

            // Save active Time-boxed Goal in H2 DB
            Goal goal = new Goal();
            goal.setUserId(testUserA.getId());
            goal.setTitle("Learn Microservices");
            goal.setStatus("In Progress");
            goal.setAutoCreateTask(true);
            goal.setGoalType("Time-boxed");
            goal.setDaysOfWeek("1,2,3,4,5"); // Mon - Fri
            goal.setDurationMinutes(60);
            goal.setPreferTime(LocalTime.of(10, 0));
            goalRepository.save(goal);

            // Save a fixed busy event at 10:00 - 11:00 in DB -> Time block auto-scheduler must shift goal session!
            FixedEvent conflictingEvent = FixedEvent.builder()
                    .user(testUserA)
                    .title("Team Standup")
                    .eventDate(checkinDate)
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(11, 0))
                    .recurrenceType("NONE")
                    .availabilityStatus("BUSY")
                    .build();
            fixedEventRepository.save(conflictingEvent);

            // Perform Check-in via API
            mockMvcUserA.perform(post("/api/calendar/checkin")
                            .param("date", "2026-08-03")
                            .param("checkinTime", "08:00"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.checkedIn").value(true))
                    .andExpect(jsonPath("$.checkinTime").value("08:00"));

            // 1. Verify DailyCheckin entity saved in H2 DB
            assertThat(dailyCheckinRepository.findByUserIdAndCheckinDate(testUserA.getId(), checkinDate)).isPresent();

            // 2. Verify Task entity created in H2 DB
            List<Task> tasks = taskRepository.findByUserId(testUserA.getId());
            assertThat(tasks).hasSize(1);
            Task generatedTask = tasks.get(0);
            assertThat(generatedTask.getTitle()).isEqualTo("Learn Microservices");

            // 3. Verify TaskTimeBlock shifted due to conflict at 10:00 -> auto-scheduled at 11:00 to 12:00
            List<TaskTimeBlock> blocks = taskTimeBlockRepository.findAll();
            assertThat(blocks).hasSize(1);
            assertThat(blocks.get(0).getStartTime()).isEqualTo(checkinDate.atTime(11, 0));
            assertThat(blocks.get(0).getEndTime()).isEqualTo(checkinDate.atTime(12, 0));
        }
    }
}
