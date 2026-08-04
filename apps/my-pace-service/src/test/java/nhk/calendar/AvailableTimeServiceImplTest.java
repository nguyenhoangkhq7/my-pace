package nhk.calendar;

import nhk.common.UserNotFoundException;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AvailableTimeServiceImplTest {

    @Mock
    private UserRepository userRepo;

    @Mock
    private DailyCheckinRepository checkinRepo;

    @Mock
    private FixedEventService eventService;

    @Mock
    private DailyPlanRepository dailyPlanRepository;

    @InjectMocks
    private AvailableTimeServiceImpl service;

    private User sampleUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(userId);
        sampleUser.setTimezone("UTC");
        sampleUser.setWakeTime(LocalTime.of(7, 0));
        sampleUser.setSleepTime(LocalTime.of(23, 0));
        sampleUser.setBufferPct(20);
    }

    @Nested
    @DisplayName("User Validation & Null Parameter Tests")
    class UserValidationTests {

        @Test
        @DisplayName("Should throw UserNotFoundException when user ID does not exist")
        void getAvailableTime_UserNotFound() {
            LocalDate date = LocalDate.now();
            when(userRepo.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getAvailableTime(userId, date))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        @DisplayName("Should return 0 available time when wakeTime or sleepTime is null")
        void getAvailableTime_NullWakeOrSleepTime() {
            sampleUser.setWakeTime(null);
            LocalDate date = LocalDate.now();
            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdOrderByCheckinDateDesc(userId)).thenReturn(Collections.emptyList());

            AvailableTimeResponse resp = service.getAvailableTime(userId, date);

            assertThat(resp.availableMinutes()).isEqualTo(0);
            assertThat(resp.workingWindowMinutes()).isEqualTo(0);
            assertThat(resp.checkedIn()).isFalse();
            assertThat(resp.streak()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Date Boundaries & Window Tests")
    class WindowTests {

        @Test
        @DisplayName("Should return 0 available minutes for past dates")
        void getAvailableTime_PastDate() {
            LocalDate pastDate = LocalDate.now(ZoneOffset.UTC).minusDays(5);
            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdAndCheckinDate(userId, pastDate)).thenReturn(Optional.empty());
            when(dailyPlanRepository.findByUserIdAndPlanDate(userId, pastDate)).thenReturn(Optional.empty());
            when(checkinRepo.findByUserIdOrderByCheckinDateDesc(userId)).thenReturn(Collections.emptyList());

            AvailableTimeResponse resp = service.getAvailableTime(userId, pastDate);

            assertThat(resp.availableMinutes()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should return available minutes for future date starting from wakeTime + 15m")
        void getAvailableTime_FutureDate() {
            LocalDate futureDate = LocalDate.now(ZoneOffset.UTC).plusDays(2);
            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdAndCheckinDate(userId, futureDate)).thenReturn(Optional.empty());
            when(dailyPlanRepository.findByUserIdAndPlanDate(userId, futureDate)).thenReturn(Optional.empty());
            when(eventService.getEventsInRange(userId, futureDate, futureDate)).thenReturn(Collections.emptyList());
            when(checkinRepo.findByUserIdOrderByCheckinDateDesc(userId)).thenReturn(Collections.emptyList());

            // wakeTime = 07:00, windowStart = 07:15, sleepTime = 23:00 (15h 45m = 945 mins)
            // buffer 20%: 945 * 0.8 = 756 mins available
            AvailableTimeResponse resp = service.getAvailableTime(userId, futureDate);

            assertThat(resp.workingWindowMinutes()).isEqualTo(945);
            assertThat(resp.blockedMinutes()).isEqualTo(0);
            assertThat(resp.availableMinutes()).isEqualTo(756);
        }

        @Test
        @DisplayName("Should adjust now time when plan is confirmed")
        void getAvailableTime_PlanConfirmed() {
            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            DailyPlan plan = new DailyPlan();
            plan.setUserId(userId);
            plan.setPlanDate(today);
            plan.setIsConfirmed(true);
            plan.setConfirmedAt(OffsetDateTime.of(today.atTime(8, 0), ZoneOffset.UTC));

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdAndCheckinDate(userId, today)).thenReturn(Optional.empty());
            when(dailyPlanRepository.findByUserIdAndPlanDate(userId, today)).thenReturn(Optional.of(plan));
            when(eventService.getEventsInRange(userId, today, today)).thenReturn(Collections.emptyList());

            AvailableTimeResponse resp = service.getAvailableTime(userId, today);

            assertThat(resp.isPlanConfirmed()).isTrue();
            // windowStart = confirmedAt (08:00) + 15m = 08:15.
            // 08:15 to 23:00 = 14h 45m = 885 mins. Buffer 20%: 885 * 0.8 = 708 mins available.
            assertThat(resp.workingWindowMinutes()).isEqualTo(885);
            assertThat(resp.availableMinutes()).isEqualTo(708);
        }
    }

    @Nested
    @DisplayName("Union-Interval Algorithm Tests")
    class UnionIntervalTests {

        @Test
        @DisplayName("Should ignore FREE status events")
        void computeUnion_IgnoreFreeEvents() {
            LocalDate futureDate = LocalDate.now(ZoneOffset.UTC).plusDays(1);
            FixedEventResponse freeEvent = FixedEventResponse.builder()
                    .id("1_" + futureDate)
                    .title("Free Time")
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(12, 0))
                    .availabilityStatus("FREE")
                    .build();

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdAndCheckinDate(userId, futureDate)).thenReturn(Optional.empty());
            when(dailyPlanRepository.findByUserIdAndPlanDate(userId, futureDate)).thenReturn(Optional.empty());
            when(eventService.getEventsInRange(userId, futureDate, futureDate)).thenReturn(List.of(freeEvent));

            AvailableTimeResponse resp = service.getAvailableTime(userId, futureDate);

            assertThat(resp.blockedMinutes()).isEqualTo(0);
            assertThat(resp.blockedIntervals()).isEmpty();
        }

        @Test
        @DisplayName("Should block entire window when an all-day busy event exists")
        void computeUnion_AllDayEvent() {
            LocalDate futureDate = LocalDate.now(ZoneOffset.UTC).plusDays(1);
            FixedEventResponse allDayEvent = FixedEventResponse.builder()
                    .id("1_" + futureDate)
                    .title("All Day Meeting")
                    .isAllDay(true)
                    .availabilityStatus("BUSY")
                    .build();

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdAndCheckinDate(userId, futureDate)).thenReturn(Optional.empty());
            when(dailyPlanRepository.findByUserIdAndPlanDate(userId, futureDate)).thenReturn(Optional.empty());
            when(eventService.getEventsInRange(userId, futureDate, futureDate)).thenReturn(List.of(allDayEvent));

            AvailableTimeResponse resp = service.getAvailableTime(userId, futureDate);

            assertThat(resp.blockedMinutes()).isEqualTo(resp.workingWindowMinutes());
            assertThat(resp.availableMinutes()).isEqualTo(0);
            assertThat(resp.blockedIntervals()).hasSize(1);
            assertThat(resp.blockedIntervals().get(0).startTime()).isEqualTo("07:15");
            assertThat(resp.blockedIntervals().get(0).endTime()).isEqualTo("23:00");
        }

        @Test
        @DisplayName("Should merge overlapping busy events correctly")
        void computeUnion_OverlappingEvents() {
            LocalDate futureDate = LocalDate.now(ZoneOffset.UTC).plusDays(1);

            // Event 1: 09:00 - 11:00 (120 min)
            FixedEventResponse event1 = FixedEventResponse.builder()
                    .id("1_" + futureDate)
                    .title("Event 1")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(11, 0))
                    .availabilityStatus("BUSY")
                    .build();

            // Event 2: 10:00 - 12:00 (Overlaps event 1, extending to 12:00 -> total 09:00 - 12:00 = 180 min)
            FixedEventResponse event2 = FixedEventResponse.builder()
                    .id("2_" + futureDate)
                    .title("Event 2")
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(12, 0))
                    .availabilityStatus("BUSY")
                    .build();

            // Event 3: 14:00 - 15:00 (60 min, non-overlapping)
            FixedEventResponse event3 = FixedEventResponse.builder()
                    .id("3_" + futureDate)
                    .title("Event 3")
                    .startTime(LocalTime.of(14, 0))
                    .endTime(LocalTime.of(15, 0))
                    .availabilityStatus("BUSY")
                    .build();

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdAndCheckinDate(userId, futureDate)).thenReturn(Optional.empty());
            when(dailyPlanRepository.findByUserIdAndPlanDate(userId, futureDate)).thenReturn(Optional.empty());
            when(eventService.getEventsInRange(userId, futureDate, futureDate)).thenReturn(List.of(event1, event2, event3));

            AvailableTimeResponse resp = service.getAvailableTime(userId, futureDate);

            // Total blocked = 180 + 60 = 240 mins
            assertThat(resp.blockedMinutes()).isEqualTo(240);
            assertThat(resp.blockedIntervals()).hasSize(2);
            assertThat(resp.blockedIntervals().get(0).startTime()).isEqualTo("09:00");
            assertThat(resp.blockedIntervals().get(0).endTime()).isEqualTo("12:00");
            assertThat(resp.blockedIntervals().get(1).startTime()).isEqualTo("14:00");
            assertThat(resp.blockedIntervals().get(1).endTime()).isEqualTo("15:00");
        }
    }

    @Nested
    @DisplayName("Streak Calculation Tests")
    class StreakTests {

        @Test
        @DisplayName("Should return 0 streak when user has no checkins")
        void getStreak_EmptyCheckins() {
            LocalDate date = LocalDate.now(ZoneOffset.UTC).plusDays(1);
            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdOrderByCheckinDateDesc(userId)).thenReturn(Collections.emptyList());

            AvailableTimeResponse resp = service.getAvailableTime(userId, date);

            assertThat(resp.streak()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should calculate consecutive streak when checked in today and previous days")
        void getStreak_CheckedInToday() {
            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            LocalDate date = today.plusDays(1);

            DailyCheckin c0 = DailyCheckin.builder().checkinDate(today).build();
            DailyCheckin c1 = DailyCheckin.builder().checkinDate(today.minusDays(1)).build();
            DailyCheckin c2 = DailyCheckin.builder().checkinDate(today.minusDays(2)).build();

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdOrderByCheckinDateDesc(userId)).thenReturn(List.of(c0, c1, c2));

            AvailableTimeResponse resp = service.getAvailableTime(userId, date);

            assertThat(resp.streak()).isEqualTo(3);
        }

        @Test
        @DisplayName("Should calculate consecutive streak when checked in yesterday (not today yet)")
        void getStreak_CheckedInYesterday() {
            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            LocalDate date = today.plusDays(1);

            DailyCheckin c1 = DailyCheckin.builder().checkinDate(today.minusDays(1)).build();
            DailyCheckin c2 = DailyCheckin.builder().checkinDate(today.minusDays(2)).build();

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdOrderByCheckinDateDesc(userId)).thenReturn(List.of(c1, c2));

            AvailableTimeResponse resp = service.getAvailableTime(userId, date);

            assertThat(resp.streak()).isEqualTo(2);
        }

        @Test
        @DisplayName("Should return 0 streak when missing both today and yesterday checkin")
        void getStreak_MissedRecentDays() {
            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            LocalDate date = today.plusDays(1);

            DailyCheckin c2 = DailyCheckin.builder().checkinDate(today.minusDays(2)).build();

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(checkinRepo.findByUserIdOrderByCheckinDateDesc(userId)).thenReturn(List.of(c2));

            AvailableTimeResponse resp = service.getAvailableTime(userId, date);

            assertThat(resp.streak()).isEqualTo(0);
        }
    }
}
