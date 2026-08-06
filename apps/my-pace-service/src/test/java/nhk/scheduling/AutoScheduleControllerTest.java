package nhk.scheduling;

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
import java.util.Map;
import java.util.UUID;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AutoScheduleControllerTest {

    @Mock
    private AutoScheduleService autoScheduleService;

    @InjectMocks
    private AutoScheduleController controller;

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
    @DisplayName("POST /api/auto-schedule/week should invoke autoScheduleService")
    void autoScheduleWeek_WithRequest() throws Exception {
        AutoScheduleWeekRequest req = new AutoScheduleWeekRequest(today, 15, true);
        AutoScheduleResponse response = new AutoScheduleResponse(today, today.plusDays(7), Map.of(), 0, false);

        when(autoScheduleService.autoScheduleWeek(userId, today, 15, true)).thenReturn(response);

        mockMvc.perform(post("/api/auto-schedule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        verify(autoScheduleService).autoScheduleWeek(userId, today, 15, true);
    }

    @Test
    @DisplayName("POST /api/auto-schedule with null request uses default values")
    void autoScheduleWeek_NullRequest() throws Exception {
        AutoScheduleResponse response = new AutoScheduleResponse(today, today.plusDays(7), Map.of(), 0, false);

        when(autoScheduleService.autoScheduleWeek(userId, null, 10, false)).thenReturn(response);

        mockMvc.perform(post("/api/auto-schedule"))
                .andExpect(status().isOk());

        verify(autoScheduleService).autoScheduleWeek(userId, null, 10, false);
    }
}
