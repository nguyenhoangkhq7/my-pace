package nhk.planning;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import nhk.user.User;
import nhk.user.UserDetailsCustom;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class DailyPlanControllerTest {

    @Mock
    private DailyPlanService dailyPlanService;

    @InjectMocks
    private DailyPlanController controller;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private User sampleUser;
    private UUID userId;
    private final LocalDate today = LocalDate.of(2026, 8, 2);

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(userId);
        sampleUser.setTimezone("Asia/Ho_Chi_Minh");

        HandlerMethodArgumentResolver principalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new UserDetailsCustom(sampleUser);
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(principalResolver)
                .build();

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("GET /api/daily-plans/{date} returns daily plan DTO")
    void getDailyPlan_Success() throws Exception {
        DailyPlanDto dto = DailyPlanDto.builder().id(UUID.randomUUID()).userId(userId).planDate(today).build();

        when(dailyPlanService.getDailyPlan(today, userId)).thenReturn(dto);

        mockMvc.perform(get("/api/daily-plans/{date}", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(dto.id().toString()));

        verify(dailyPlanService).getDailyPlan(today, userId);
    }

    @Test
    @DisplayName("GET /api/daily-plans/range returns list of daily plan DTOs")
    void getDailyPlansInRange_Success() throws Exception {
        LocalDate startDate = today;
        LocalDate endDate = today.plusDays(2);
        DailyPlanDto dto = DailyPlanDto.builder().id(UUID.randomUUID()).userId(userId).planDate(today).build();

        when(dailyPlanService.getDailyPlansInRange(startDate, endDate, userId)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/daily-plans/range")
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(dto.id().toString()));

        verify(dailyPlanService).getDailyPlansInRange(startDate, endDate, userId);
    }

    @Test
    @DisplayName("GET /api/daily-plans/unreviewed returns unreviewed plan DTO")
    void getUnreviewedPlan_Success() throws Exception {
        DailyPlanDto dto = DailyPlanDto.builder().id(UUID.randomUUID()).userId(userId).planDate(today.minusDays(1)).build();

        when(dailyPlanService.getUnreviewedPlan(today, userId)).thenReturn(dto);

        mockMvc.perform(get("/api/daily-plans/unreviewed")
                        .param("today", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(dto.id().toString()));

        verify(dailyPlanService).getUnreviewedPlan(today, userId);
    }

    @Test
    @DisplayName("POST /api/daily-plans/plan-my-day plans day and returns updated plan")
    void planMyDay_Success() throws Exception {
        PlanMyDayRequest req = new PlanMyDayRequest(today, 120, List.of());
        DailyPlanDto dto = DailyPlanDto.builder().id(UUID.randomUUID()).userId(userId).planDate(today).build();

        when(dailyPlanService.planMyDay(any(PlanMyDayRequest.class), eq(userId))).thenReturn(dto);

        mockMvc.perform(post("/api/daily-plans/plan-my-day")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(dto.id().toString()));

        verify(dailyPlanService).planMyDay(any(PlanMyDayRequest.class), eq(userId));
    }

    @Test
    @DisplayName("POST /api/daily-plans/{date}/confirm confirms plan")
    void confirmPlan_Success() throws Exception {
        DailyPlanDto dto = DailyPlanDto.builder().id(UUID.randomUUID()).isConfirmed(true).build();

        when(dailyPlanService.confirmPlan(today, userId)).thenReturn(dto);

        mockMvc.perform(post("/api/daily-plans/{date}/confirm", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isConfirmed").value(true));

        verify(dailyPlanService).confirmPlan(today, userId);
    }

    @Test
    @DisplayName("POST /api/daily-plans/{date}/unconfirm unconfirms plan")
    void unconfirmPlan_Success() throws Exception {
        DailyPlanDto dto = DailyPlanDto.builder().id(UUID.randomUUID()).isConfirmed(false).build();

        when(dailyPlanService.unconfirmPlan(today, userId)).thenReturn(dto);

        mockMvc.perform(post("/api/daily-plans/{date}/unconfirm", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isConfirmed").value(false));

        verify(dailyPlanService).unconfirmPlan(today, userId);
    }

    @Test
    @DisplayName("POST /api/daily-plans/{date}/cancel cancels plan returning status NO_CONTENT")
    void cancelPlan_Success() throws Exception {
        mockMvc.perform(post("/api/daily-plans/{date}/cancel", today.toString()))
                .andExpect(status().isNoContent());

        verify(dailyPlanService).cancelPlan(today, userId);
    }

    @Test
    @DisplayName("POST /api/daily-plans/{date}/review reviews plan and returns updated plan")
    void reviewPlan_Success() throws Exception {
        ReviewPlanRequest req = new ReviewPlanRequest(today, List.of());
        DailyPlanDto dto = DailyPlanDto.builder().id(UUID.randomUUID()).isReviewed(true).build();

        when(dailyPlanService.reviewPlan(eq(today), any(), eq(userId))).thenReturn(dto);

        mockMvc.perform(post("/api/daily-plans/{date}/review", today.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isReviewed").value(true));

        verify(dailyPlanService).reviewPlan(eq(today), any(), eq(userId));
    }

    @Test
    @DisplayName("PUT /api/daily-plans/tasks/{planTaskId}/toggle-done toggles task status returning NO_CONTENT")
    void toggleTaskDone_Success() throws Exception {
        UUID planTaskId = UUID.randomUUID();

        mockMvc.perform(put("/api/daily-plans/tasks/{planTaskId}/toggle-done", planTaskId.toString()))
                .andExpect(status().isNoContent());

        verify(dailyPlanService).toggleTaskDone(planTaskId, userId);
    }
}
