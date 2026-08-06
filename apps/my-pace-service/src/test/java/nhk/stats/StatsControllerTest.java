package nhk.stats;

import nhk.user.Role;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.Map;
import java.util.UUID;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class StatsControllerTest {

    @Mock
    private StatsService statsService;

    @InjectMocks
    private StatsController statsController;

    private MockMvc mockMvc;
    private UUID userId;
    private UserDetailsCustom userDetailsCustom;
    private StatsResponse sampleResponse;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setEmail("user@example.com");
        user.setRole(Role.USER);

        userDetailsCustom = new UserDetailsCustom(user);

        sampleResponse = StatsResponse.builder()
                .matrixTime(Map.of("q1", 60, "q2", 120, "q3", 30, "q4", 0))
                .categoryTime(Map.of("Work", 180))
                .completionRate(85.5)
                .streak(5)
                .build();

        HandlerMethodArgumentResolver authenticationPrincipalResolver = new HandlerMethodArgumentResolver() {
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
                .setCustomArgumentResolvers(authenticationPrincipalResolver)
                .build();
    }

    @Test
    @DisplayName("GET /api/stats/overview with dates should return 200 OK and StatsResponse")
    void getOverview_Success_WithDates() throws Exception {
        String startDate = "2026-07-01";
        String endDate = "2026-08-01";

        when(statsService.getOverview(userId, startDate, endDate)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/stats/overview")
                        .param("startDate", startDate)
                        .param("endDate", endDate))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completionRate").value(85.5))
                .andExpect(jsonPath("$.streak").value(5))
                .andExpect(jsonPath("$.matrixTime.q1").value(60))
                .andExpect(jsonPath("$.matrixTime.q2").value(120))
                .andExpect(jsonPath("$.categoryTime.Work").value(180));

        verify(statsService).getOverview(userId, startDate, endDate);
    }

    @Test
    @DisplayName("GET /api/stats/overview without dates should return 200 OK")
    void getOverview_Success_WithoutDates() throws Exception {
        when(statsService.getOverview(userId, null, null)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/stats/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completionRate").value(85.5))
                .andExpect(jsonPath("$.streak").value(5));

        verify(statsService).getOverview(userId, null, null);
    }
}
