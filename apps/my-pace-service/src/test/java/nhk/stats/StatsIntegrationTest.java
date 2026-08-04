package nhk.stats;

import nhk.calendar.DailyCheckin;
import nhk.calendar.DailyCheckinRepository;
import nhk.category.Category;
import nhk.category.CategoryRepository;
import nhk.mail.SendOtpMailService;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;
import nhk.planning.DailyPlanTask;
import nhk.planning.DailyPlanTaskRepository;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserDetailsCustom;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.MethodParameter;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StatsIntegrationTest {

    @Autowired
    private StatsController statsController;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private DailyPlanRepository dailyPlanRepository;

    @Autowired
    private DailyPlanTaskRepository dailyPlanTaskRepository;

    @Autowired
    private DailyCheckinRepository dailyCheckinRepository;

    @MockitoBean
    private StringRedisTemplate redisTemplate;

    @MockitoBean
    private SendOtpMailService sendOtpMailService;

    private MockMvc mockMvc;
    private User testUser;
    private UserDetailsCustom userDetailsCustom;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("stats.user@example.com");
        testUser.setPasswordHash("hashed_password");
        testUser.setFullName("Stats Test User");
        testUser.setRole(Role.USER);
        testUser.setTimezone("Asia/Ho_Chi_Minh");
        testUser = userRepository.save(testUser);

        userDetailsCustom = new UserDetailsCustom(testUser);

        HandlerMethodArgumentResolver authResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                        || parameter.getParameterType().isAssignableFrom(UserDetailsCustom.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return userDetailsCustom;
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(statsController)
                .setCustomArgumentResolvers(authResolver)
                .build();
    }

    @Test
    @DisplayName("GET /api/stats/overview with populated data returns accurate matrix, categories, completion rate and streak")
    void getOverview_Success_FullData() throws Exception {
        ZoneId userZone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDate today = LocalDate.now(userZone);

        // 1. Create categories
        Category workCat = new Category();
        workCat.setUserId(testUser.getId());
        workCat.setName("Work");
        workCat.setColor("#3b82f6");
        workCat = categoryRepository.save(workCat);

        Category personalCat = new Category();
        personalCat.setUserId(testUser.getId());
        personalCat.setName("Personal");
        personalCat.setColor("#10b981");
        personalCat = categoryRepository.save(personalCat);

        // 2. Create tasks for matrix and category calculation
        // Q1: Urgent=true, Important=true, Work category, 60 mins
        Task q1Task = new Task();
        q1Task.setUserId(testUser.getId());
        q1Task.setTitle("Q1 Task");
        q1Task.setIsUrgent(true);
        q1Task.setIsImportant(true);
        q1Task.setStatus("Done");
        q1Task.setActualMinutes(60);
        q1Task.setCategoryId(workCat.getId());
        q1Task.setCategory(workCat);
        q1Task.setDoneAt(OffsetDateTime.now());
        q1Task = taskRepository.save(q1Task);

        // Q2: Urgent=false, Important=true, Work category, 120 mins
        Task q2Task = new Task();
        q2Task.setUserId(testUser.getId());
        q2Task.setTitle("Q2 Task");
        q2Task.setIsUrgent(false);
        q2Task.setIsImportant(true);
        q2Task.setStatus("Done");
        q2Task.setActualMinutes(120);
        q2Task.setCategoryId(workCat.getId());
        q2Task.setCategory(workCat);
        q2Task.setDoneAt(OffsetDateTime.now());
        q2Task = taskRepository.save(q2Task);

        // Q3: Urgent=true, Important=false, Personal category, 30 mins
        Task q3Task = new Task();
        q3Task.setUserId(testUser.getId());
        q3Task.setTitle("Q3 Task");
        q3Task.setIsUrgent(true);
        q3Task.setIsImportant(false);
        q3Task.setStatus("Done");
        q3Task.setActualMinutes(30);
        q3Task.setCategoryId(personalCat.getId());
        q3Task.setCategory(personalCat);
        q3Task.setDoneAt(OffsetDateTime.now());
        q3Task = taskRepository.save(q3Task);

        // Q4: Urgent=false, Important=false, No category ("Chưa phân loại"), 15 mins
        Task q4Task = new Task();
        q4Task.setUserId(testUser.getId());
        q4Task.setTitle("Q4 Task");
        q4Task.setIsUrgent(false);
        q4Task.setIsImportant(false);
        q4Task.setStatus("Done");
        q4Task.setActualMinutes(15);
        q4Task.setCategoryId(null);
        q4Task.setDoneAt(OffsetDateTime.now());
        q4Task = taskRepository.save(q4Task);

        // 3. Create DailyPlan & DailyPlanTasks for completion rate calculation
        DailyPlan dailyPlan = new DailyPlan();
        dailyPlan.setUserId(testUser.getId());
        dailyPlan.setPlanDate(today);
        dailyPlan.setAvailableMinutes(300);
        dailyPlan.setIsConfirmed(true);
        dailyPlan = dailyPlanRepository.save(dailyPlan);

        DailyPlanTask dpt1 = new DailyPlanTask();
        dpt1.setDailyPlanId(dailyPlan.getId());
        dpt1.setTask(q1Task);
        dpt1.setIsMit(true);
        dpt1.setSortOrder(1);
        dailyPlanTaskRepository.save(dpt1);

        DailyPlanTask dpt2 = new DailyPlanTask();
        dpt2.setDailyPlanId(dailyPlan.getId());
        dpt2.setTask(q2Task);
        dpt2.setIsMit(false);
        dpt2.setSortOrder(2);
        dailyPlanTaskRepository.save(dpt2);

        // 4. Create DailyCheckins for streak calculation (today and yesterday)
        DailyCheckin checkinToday = DailyCheckin.builder()
                .user(testUser)
                .checkinDate(today)
                .checkinTime(LocalTime.of(8, 0))
                .build();
        dailyCheckinRepository.save(checkinToday);

        DailyCheckin checkinYesterday = DailyCheckin.builder()
                .user(testUser)
                .checkinDate(today.minusDays(1))
                .checkinTime(LocalTime.of(8, 30))
                .build();
        dailyCheckinRepository.save(checkinYesterday);

        // Execute GET /api/stats/overview
        mockMvc.perform(get("/api/stats/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matrixTime.q1").value(60))
                .andExpect(jsonPath("$.matrixTime.q2").value(120))
                .andExpect(jsonPath("$.matrixTime.q3").value(30))
                .andExpect(jsonPath("$.matrixTime.q4").value(15))
                .andExpect(jsonPath("$.categoryTime.Work").value(180))
                .andExpect(jsonPath("$.categoryTime.Personal").value(30))
                .andExpect(jsonPath("$.categoryTime['Chưa phân loại']").value(15))
                .andExpect(jsonPath("$.completionRate").value(100.0))
                .andExpect(jsonPath("$.streak").value(2));
    }

    @Test
    @DisplayName("GET /api/stats/overview with custom date range filters data correctly")
    void getOverview_Success_WithCustomDateRange() throws Exception {
        String startDate = LocalDate.now().minusDays(10).toString();
        String endDate = LocalDate.now().toString();

        mockMvc.perform(get("/api/stats/overview")
                        .param("startDate", startDate)
                        .param("endDate", endDate))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completionRate").value(0.0))
                .andExpect(jsonPath("$.streak").value(0));
    }

    @Test
    @DisplayName("GET /api/stats/overview for empty database returns zeroed metrics")
    void getOverview_Success_EmptyData() throws Exception {
        mockMvc.perform(get("/api/stats/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matrixTime.q1").value(0))
                .andExpect(jsonPath("$.matrixTime.q2").value(0))
                .andExpect(jsonPath("$.matrixTime.q3").value(0))
                .andExpect(jsonPath("$.matrixTime.q4").value(0))
                .andExpect(jsonPath("$.completionRate").value(0.0))
                .andExpect(jsonPath("$.streak").value(0));
    }
}
