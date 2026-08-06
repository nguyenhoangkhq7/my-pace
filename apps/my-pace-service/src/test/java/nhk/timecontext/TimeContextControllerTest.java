package nhk.timecontext;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TimeContextControllerTest {

    @Mock
    private TimeContextService timeContextService;

    @InjectMocks
    private TimeContextController timeContextController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private UUID userId;
    private UUID contextId;
    private UserDetailsCustom userDetailsCustom;
    private TimeContextDto sampleDto;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        contextId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setEmail("user@example.com");
        user.setRole(Role.USER);

        userDetailsCustom = new UserDetailsCustom(user);
        sampleDto = new TimeContextDto(contextId, "Morning Focus", Collections.emptyList(), Collections.emptyList());

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

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

        mockMvc = MockMvcBuilders.standaloneSetup(timeContextController)
                .setCustomArgumentResolvers(authenticationPrincipalResolver)
                .build();
    }

    @Test
    @DisplayName("GET /api/time-contexts should return 200 OK and list of TimeContextDto")
    void getTimeContexts_success() throws Exception {
        when(timeContextService.getTimeContexts(userId)).thenReturn(List.of(sampleDto));

        mockMvc.perform(get("/api/time-contexts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(contextId.toString()))
                .andExpect(jsonPath("$[0].name").value("Morning Focus"));

        verify(timeContextService, times(1)).getTimeContexts(userId);
    }

    @Test
    @DisplayName("GET /api/time-contexts/{id} should return 200 OK and TimeContextDto")
    void getTimeContext_success() throws Exception {
        when(timeContextService.getTimeContext(contextId, userId)).thenReturn(sampleDto);

        mockMvc.perform(get("/api/time-contexts/{id}", contextId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(contextId.toString()))
                .andExpect(jsonPath("$.name").value("Morning Focus"));

        verify(timeContextService, times(1)).getTimeContext(contextId, userId);
    }

    @Test
    @DisplayName("POST /api/time-contexts should return 201 Created when request is valid")
    void createTimeContext_success() throws Exception {
        TimeContextSlotDto slot = new TimeContextSlotDto(null, DayOfWeek.MONDAY, LocalTime.of(8, 0), LocalTime.of(11, 0));
        TimeContextCreateRequest request = new TimeContextCreateRequest("Morning Focus", List.of(slot), Collections.emptyList());

        when(timeContextService.createTimeContext(any(TimeContextCreateRequest.class), eq(userId)))
                .thenReturn(sampleDto);

        mockMvc.perform(post("/api/time-contexts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(contextId.toString()))
                .andExpect(jsonPath("$.name").value("Morning Focus"));

        verify(timeContextService, times(1)).createTimeContext(any(TimeContextCreateRequest.class), eq(userId));
    }

    @Test
    @DisplayName("POST /api/time-contexts should return 400 Bad Request when name is blank")
    void createTimeContext_blankName_returns400() throws Exception {
        TimeContextCreateRequest request = new TimeContextCreateRequest("", Collections.emptyList(), Collections.emptyList());

        mockMvc.perform(post("/api/time-contexts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(timeContextService, never()).createTimeContext(any(), any());
    }

    @Test
    @DisplayName("PUT /api/time-contexts/{id} should return 200 OK when request is valid")
    void updateTimeContext_success() throws Exception {
        TimeContextUpdateRequest request = new TimeContextUpdateRequest("Evening Focus", Collections.emptyList(), Collections.emptyList());
        TimeContextDto updatedDto = new TimeContextDto(contextId, "Evening Focus", Collections.emptyList(), Collections.emptyList());

        when(timeContextService.updateTimeContext(eq(contextId), any(TimeContextUpdateRequest.class), eq(userId)))
                .thenReturn(updatedDto);

        mockMvc.perform(put("/api/time-contexts/{id}", contextId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(contextId.toString()))
                .andExpect(jsonPath("$.name").value("Evening Focus"));

        verify(timeContextService, times(1)).updateTimeContext(eq(contextId), any(TimeContextUpdateRequest.class), eq(userId));
    }

    @Test
    @DisplayName("PUT /api/time-contexts/{id} should return 400 Bad Request when name is blank")
    void updateTimeContext_blankName_returns400() throws Exception {
        TimeContextUpdateRequest request = new TimeContextUpdateRequest("   ", Collections.emptyList(), Collections.emptyList());

        mockMvc.perform(put("/api/time-contexts/{id}", contextId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(timeContextService, never()).updateTimeContext(any(), any(), any());
    }

    @Test
    @DisplayName("DELETE /api/time-contexts/{id} should return 204 No Content")
    void deleteTimeContext_success() throws Exception {
        doNothing().when(timeContextService).deleteTimeContext(contextId, userId);

        mockMvc.perform(delete("/api/time-contexts/{id}", contextId))
                .andExpect(status().isNoContent());

        verify(timeContextService, times(1)).deleteTimeContext(contextId, userId);
    }
}
