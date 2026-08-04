package nhk.calendar;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import nhk.user.User;
import nhk.user.UserDetailsCustom;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class FixedEventControllerTest {

    @Mock
    private FixedEventService service;

    @Mock
    private AvailableTimeService availableTimeService;

    @Mock
    private DailyCheckinService dailyCheckinService;

    @InjectMocks
    private FixedEventController controller;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private User sampleUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(userId);
        sampleUser.setTimezone("UTC");

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

    @Nested
    @DisplayName("Event Endpoint Tests")
    class EventEndpointTests {

        @Test
        @DisplayName("GET /api/calendar/events should return occurrences in date range")
        void getEvents_Success() throws Exception {
            LocalDate start = LocalDate.of(2026, 8, 1);
            LocalDate end = LocalDate.of(2026, 8, 7);

            FixedEventResponse resp = FixedEventResponse.builder()
                    .id(UUID.randomUUID() + "_" + start)
                    .title("Meeting")
                    .occurrenceDate(start)
                    .build();

            when(service.getEventsInRange(userId, start, end)).thenReturn(List.of(resp));

            mockMvc.perform(get("/api/calendar/events")
                            .param("start", "2026-08-01")
                            .param("end", "2026-08-07"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].title").value("Meeting"));

            verify(service).getEventsInRange(userId, start, end);
        }

        @Test
        @DisplayName("POST /api/calendar/events should create event and return 201 Created")
        void createEvent_Success() throws Exception {
            FixedEventRequest request = new FixedEventRequest(
                    "Gym", "Leg day", LocalTime.of(18, 0), LocalTime.of(19, 30),
                    false, LocalDate.of(2026, 8, 5), "NONE", null, null, null, "BUSY"
            );

            FixedEventResponse response = FixedEventResponse.builder()
                    .id(UUID.randomUUID() + "_2026-08-05")
                    .title("Gym")
                    .build();

            when(service.createEvent(eq(userId), any(FixedEventRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/calendar/events")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.title").value("Gym"));
        }

        @Test
        @DisplayName("PUT /api/calendar/events/{id} should update all occurrences")
        void updateAllOccurrences_Success() throws Exception {
            UUID eventId = UUID.randomUUID();
            FixedEventRequest request = new FixedEventRequest(
                    "Updated Title", null, LocalTime.of(9, 0), LocalTime.of(10, 0),
                    false, LocalDate.of(2026, 8, 5), "NONE", null, null, null, "BUSY"
            );

            FixedEventResponse response = FixedEventResponse.builder()
                    .id(eventId + "_2026-08-05")
                    .title("Updated Title")
                    .build();

            when(service.updateAllOccurrences(eq(userId), eq(eventId), any(FixedEventRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(put("/api/calendar/events/{id}", eventId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("Updated Title"));
        }

        @Test
        @DisplayName("PUT /api/calendar/events/{id}/all should update all occurrences")
        void updateAllOccurrencesAlias_Success() throws Exception {
            UUID eventId = UUID.randomUUID();
            FixedEventRequest request = new FixedEventRequest(
                    "Updated Title", null, LocalTime.of(9, 0), LocalTime.of(10, 0),
                    false, LocalDate.of(2026, 8, 5), "NONE", null, null, null, "BUSY"
            );

            FixedEventResponse response = FixedEventResponse.builder()
                    .id(eventId + "_2026-08-05")
                    .title("Updated Title")
                    .build();

            when(service.updateAllOccurrences(eq(userId), eq(eventId), any(FixedEventRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(put("/api/calendar/events/{id}/all", eventId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("Updated Title"));
        }

        @Test
        @DisplayName("PATCH /api/calendar/events/{id}/exceptions/{date} should update single occurrence")
        void updateSingleOccurrence_Success() throws Exception {
            UUID eventId = UUID.randomUUID();
            LocalDate date = LocalDate.of(2026, 8, 5);
            FixedEventExceptionRequest request = new FixedEventExceptionRequest(
                    "Override Title", null, null, null, null, false, null, "FREE"
            );

            FixedEventResponse response = FixedEventResponse.builder()
                    .id(eventId + "_" + date)
                    .title("Override Title")
                    .isException(true)
                    .build();

            when(service.updateSingleOccurrence(eq(userId), eq(eventId), eq(date), any(FixedEventExceptionRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(patch("/api/calendar/events/{id}/exceptions/{date}", eventId, date)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("Override Title"));
        }

        @Test
        @DisplayName("PUT /api/calendar/events/{id}/occurrences/{date} should update single occurrence")
        void updateSingleOccurrenceAliasPut_Success() throws Exception {
            UUID eventId = UUID.randomUUID();
            LocalDate date = LocalDate.of(2026, 8, 5);
            FixedEventExceptionRequest request = new FixedEventExceptionRequest(
                    "Override Title", null, null, null, null, false, null, "FREE"
            );

            FixedEventResponse response = FixedEventResponse.builder()
                    .id(eventId + "_" + date)
                    .title("Override Title")
                    .isException(true)
                    .build();

            when(service.updateSingleOccurrence(eq(userId), eq(eventId), eq(date), any(FixedEventExceptionRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(put("/api/calendar/events/{id}/occurrences/{date}", eventId, date)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("Override Title"));
        }

        @Test
        @DisplayName("PATCH /api/calendar/events/{id}/occurrences/{date} should update single occurrence")
        void updateSingleOccurrenceAliasPatch_Success() throws Exception {
            UUID eventId = UUID.randomUUID();
            LocalDate date = LocalDate.of(2026, 8, 5);
            FixedEventExceptionRequest request = new FixedEventExceptionRequest(
                    "Override Title", null, null, null, null, false, null, "FREE"
            );

            FixedEventResponse response = FixedEventResponse.builder()
                    .id(eventId + "_" + date)
                    .title("Override Title")
                    .isException(true)
                    .build();

            when(service.updateSingleOccurrence(eq(userId), eq(eventId), eq(date), any(FixedEventExceptionRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(patch("/api/calendar/events/{id}/occurrences/{date}", eventId, date)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("Override Title"));
        }

        @Test
        @DisplayName("DELETE /api/calendar/events/{id} should return 204 No Content")
        void deleteAllOccurrences_Success() throws Exception {
            UUID eventId = UUID.randomUUID();

            mockMvc.perform(delete("/api/calendar/events/{id}", eventId))
                    .andExpect(status().isNoContent());

            verify(service).deleteAllOccurrences(userId, eventId);
        }

        @Test
        @DisplayName("DELETE /api/calendar/events/{id}/all should return 204 No Content")
        void deleteAllOccurrencesAlias_Success() throws Exception {
            UUID eventId = UUID.randomUUID();

            mockMvc.perform(delete("/api/calendar/events/{id}/all", eventId))
                    .andExpect(status().isNoContent());

            verify(service).deleteAllOccurrences(userId, eventId);
        }

        @Test
        @DisplayName("DELETE /api/calendar/events/{id}/exceptions/{date} should return 204 No Content")
        void deleteSingleOccurrence_Success() throws Exception {
            UUID eventId = UUID.randomUUID();
            LocalDate date = LocalDate.of(2026, 8, 5);

            mockMvc.perform(delete("/api/calendar/events/{id}/exceptions/{date}", eventId, date))
                    .andExpect(status().isNoContent());

            verify(service).deleteSingleOccurrence(userId, eventId, date);
        }

        @Test
        @DisplayName("DELETE /api/calendar/events/{id}/occurrences/{date} should return 204 No Content")
        void deleteSingleOccurrenceAlias_Success() throws Exception {
            UUID eventId = UUID.randomUUID();
            LocalDate date = LocalDate.of(2026, 8, 5);

            mockMvc.perform(delete("/api/calendar/events/{id}/occurrences/{date}", eventId, date))
                    .andExpect(status().isNoContent());

            verify(service).deleteSingleOccurrence(userId, eventId, date);
        }

        @Test
        @DisplayName("DELETE /api/calendar/events/{id}/from/{date} should return 204 No Content")
        void deleteFromDateOnwards_Success() throws Exception {
            UUID eventId = UUID.randomUUID();
            LocalDate date = LocalDate.of(2026, 8, 5);

            mockMvc.perform(delete("/api/calendar/events/{id}/from/{date}", eventId, date))
                    .andExpect(status().isNoContent());

            verify(service).deleteFromDateOnwards(userId, eventId, date);
        }
    }

    @Nested
    @DisplayName("Available Time & Checkin Endpoint Tests")
    class AvailableTimeAndCheckinEndpointTests {

        @Test
        @DisplayName("GET /api/calendar/available-time should return available time response")
        void getAvailableTime_Success() throws Exception {
            LocalDate date = LocalDate.of(2026, 8, 5);
            AvailableTimeResponse response = AvailableTimeResponse.builder()
                    .availableMinutes(450)
                    .workingWindowMinutes(600)
                    .blockedMinutes(150)
                    .build();

            when(availableTimeService.getAvailableTime(userId, date)).thenReturn(response);

            mockMvc.perform(get("/api/calendar/available-time")
                            .param("date", "2026-08-05"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.availableMinutes").value(450));
        }

        @Test
        @DisplayName("POST /api/calendar/checkin should perform checkin and return available time response")
        void checkin_Success() throws Exception {
            LocalDate date = LocalDate.of(2026, 8, 5);
            LocalTime checkinTime = LocalTime.of(8, 30);
            AvailableTimeResponse response = AvailableTimeResponse.builder()
                    .checkedIn(true)
                    .checkinTime("08:30")
                    .build();

            when(dailyCheckinService.checkin(userId, date, checkinTime)).thenReturn(response);

            mockMvc.perform(post("/api/calendar/checkin")
                            .param("date", "2026-08-05")
                            .param("checkinTime", "08:30"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.checkedIn").value(true));
        }
    }
}
