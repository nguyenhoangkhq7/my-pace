package nhk.calendar;

import nhk.category.Category;
import nhk.category.CategoryDto;
import nhk.category.CategoryMapper;
import nhk.category.CategoryRepository;
import nhk.common.CategoryNotFoundException;
import nhk.common.EventNotFoundException;
import nhk.common.UserNotFoundException;
import nhk.user.User;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FixedEventServiceImplTest {

    @Mock
    private FixedEventRepository eventRepo;

    @Mock
    private FixedEventExceptionRepository exceptionRepo;

    @Mock
    private UserRepository userRepo;

    @Mock
    private CategoryRepository categoryRepo;

    @Mock
    private CategoryMapper categoryMapper;

    @InjectMocks
    private FixedEventServiceImpl service;

    private User sampleUser;
    private UUID userId;
    private Category sampleCategory;
    private UUID categoryId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(userId);
        sampleUser.setTimezone("UTC");

        categoryId = UUID.randomUUID();
        sampleCategory = new Category();
        sampleCategory.setId(categoryId);
        sampleCategory.setUserId(userId);
        sampleCategory.setName("Work");
    }

    @Nested
    @DisplayName("getEventsInRange Tests")
    class GetEventsInRangeTests {

        @Test
        @DisplayName("Should return empty list when no active events found in range")
        void getEventsInRange_Empty() {
            LocalDate start = LocalDate.of(2026, 8, 1);
            LocalDate end = LocalDate.of(2026, 8, 7);
            when(eventRepo.findActiveInRange(userId, start, end)).thenReturn(Collections.emptyList());

            List<FixedEventResponse> responses = service.getEventsInRange(userId, start, end);

            assertThat(responses).isEmpty();
            verify(eventRepo).findActiveInRange(userId, start, end);
            verifyNoInteractions(exceptionRepo);
        }

        @Test
        @DisplayName("Should expand non-recurring event correctly when within range")
        void getEventsInRange_NonRecurringEvent() {
            LocalDate date = LocalDate.of(2026, 8, 3);
            FixedEvent fe = FixedEvent.builder()
                    .id(UUID.randomUUID())
                    .user(sampleUser)
                    .title("Meeting")
                    .eventDate(date)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(10, 0))
                    .isAllDay(false)
                    .recurrenceType("NONE")
                    .availabilityStatus("BUSY")
                    .build();

            when(eventRepo.findActiveInRange(userId, date, date)).thenReturn(List.of(fe));
            when(exceptionRepo.findByFixedEventIdInAndOccurrenceDateBetween(List.of(fe.getId()), date, date))
                    .thenReturn(Collections.emptyList());

            List<FixedEventResponse> responses = service.getEventsInRange(userId, date, date);

            assertThat(responses).hasSize(1);
            FixedEventResponse resp = responses.get(0);
            assertThat(resp.title()).isEqualTo("Meeting");
            assertThat(resp.occurrenceDate()).isEqualTo(date);
            assertThat(resp.isException()).isFalse();
        }

        @Test
        @DisplayName("Should expand DAILY recurring event for all days in range")
        void getEventsInRange_DailyRecurring() {
            LocalDate start = LocalDate.of(2026, 8, 1);
            LocalDate end = LocalDate.of(2026, 8, 3);
            FixedEvent fe = FixedEvent.builder()
                    .id(UUID.randomUUID())
                    .user(sampleUser)
                    .title("Daily Exercise")
                    .eventDate(start)
                    .startTime(LocalTime.of(7, 0))
                    .endTime(LocalTime.of(8, 0))
                    .isAllDay(false)
                    .recurrenceType("DAILY")
                    .availabilityStatus("BUSY")
                    .build();

            when(eventRepo.findActiveInRange(userId, start, end)).thenReturn(List.of(fe));
            when(exceptionRepo.findByFixedEventIdInAndOccurrenceDateBetween(List.of(fe.getId()), start, end))
                    .thenReturn(Collections.emptyList());

            List<FixedEventResponse> responses = service.getEventsInRange(userId, start, end);

            assertThat(responses).hasSize(3);
            assertThat(responses.stream().map(FixedEventResponse::occurrenceDate))
                    .containsExactly(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 2), LocalDate.of(2026, 8, 3));
        }

        @Test
        @DisplayName("Should expand WEEKLY recurring event only on specified days of week")
        void getEventsInRange_WeeklyRecurring() {
            LocalDate start = LocalDate.of(2026, 8, 3); // Monday (1)
            LocalDate end = LocalDate.of(2026, 8, 9);   // Sunday (7)
            FixedEvent fe = FixedEvent.builder()
                    .id(UUID.randomUUID())
                    .user(sampleUser)
                    .title("Weekly Sync")
                    .eventDate(start)
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(11, 0))
                    .recurrenceType("WEEKLY")
                    .recurrenceRule("1,3,5") // Mon, Wed, Fri
                    .availabilityStatus("BUSY")
                    .build();

            when(eventRepo.findActiveInRange(userId, start, end)).thenReturn(List.of(fe));
            when(exceptionRepo.findByFixedEventIdInAndOccurrenceDateBetween(List.of(fe.getId()), start, end))
                    .thenReturn(Collections.emptyList());

            List<FixedEventResponse> responses = service.getEventsInRange(userId, start, end);

            assertThat(responses).hasSize(3);
            assertThat(responses.stream().map(FixedEventResponse::occurrenceDate))
                    .containsExactly(
                            LocalDate.of(2026, 8, 3), // Mon
                            LocalDate.of(2026, 8, 5), // Wed
                            LocalDate.of(2026, 8, 7)  // Fri
                    );
        }

        @Test
        @DisplayName("Should omit occurrence when soft-deleted exception exists")
        void getEventsInRange_SoftDeletedException() {
            LocalDate start = LocalDate.of(2026, 8, 1);
            LocalDate end = LocalDate.of(2026, 8, 2);
            FixedEvent fe = FixedEvent.builder()
                    .id(UUID.randomUUID())
                    .user(sampleUser)
                    .title("Daily Standup")
                    .eventDate(start)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(9, 30))
                    .recurrenceType("DAILY")
                    .build();

            FixedEventException deletedEx = new FixedEventException();
            deletedEx.setFixedEvent(fe);
            deletedEx.setOccurrenceDate(LocalDate.of(2026, 8, 2));
            deletedEx.setIsDeleted(true);

            when(eventRepo.findActiveInRange(userId, start, end)).thenReturn(List.of(fe));
            when(exceptionRepo.findByFixedEventIdInAndOccurrenceDateBetween(List.of(fe.getId()), start, end))
                    .thenReturn(List.of(deletedEx));

            List<FixedEventResponse> responses = service.getEventsInRange(userId, start, end);

            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).occurrenceDate()).isEqualTo(LocalDate.of(2026, 8, 1));
        }

        @Test
        @DisplayName("Should apply overrides from exception when building response")
        void getEventsInRange_WithOverrideException() {
            LocalDate date = LocalDate.of(2026, 8, 3);
            FixedEvent fe = FixedEvent.builder()
                    .id(UUID.randomUUID())
                    .user(sampleUser)
                    .title("Original Title")
                    .eventDate(date)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(10, 0))
                    .recurrenceType("DAILY")
                    .availabilityStatus("BUSY")
                    .build();

            Category overrideCat = new Category();
            overrideCat.setId(UUID.randomUUID());
            overrideCat.setName("Personal");

            CategoryDto catDto = new CategoryDto(overrideCat.getId(), "Personal", null, null);

            FixedEventException ex = new FixedEventException();
            ex.setFixedEvent(fe);
            ex.setOccurrenceDate(date);
            ex.setOverrideTitle("Overridden Title");
            ex.setOverrideStartTime(LocalTime.of(10, 0));
            ex.setOverrideEndTime(LocalTime.of(11, 0));
            ex.setOverrideCategory(overrideCat);
            ex.setOverrideAvailabilityStatus("FREE");
            ex.setIsDeleted(false);

            when(eventRepo.findActiveInRange(userId, date, date)).thenReturn(List.of(fe));
            when(exceptionRepo.findByFixedEventIdInAndOccurrenceDateBetween(List.of(fe.getId()), date, date))
                    .thenReturn(List.of(ex));
            when(categoryMapper.toDto(overrideCat)).thenReturn(catDto);

            List<FixedEventResponse> responses = service.getEventsInRange(userId, date, date);

            assertThat(responses).hasSize(1);
            FixedEventResponse resp = responses.get(0);
            assertThat(resp.title()).isEqualTo("Overridden Title");
            assertThat(resp.startTime()).isEqualTo(LocalTime.of(10, 0));
            assertThat(resp.endTime()).isEqualTo(LocalTime.of(11, 0));
            assertThat(resp.availabilityStatus()).isEqualTo("FREE");
            assertThat(resp.isException()).isTrue();
            assertThat(resp.category()).isEqualTo(catDto);
        }
    }

    @Nested
    @DisplayName("createEvent Tests")
    class CreateEventTests {

        @Test
        @DisplayName("Should throw UserNotFoundException when user does not exist")
        void createEvent_UserNotFound() {
            FixedEventRequest req = new FixedEventRequest(
                    "Title", "Notes", LocalTime.of(9, 0), LocalTime.of(10, 0),
                    false, LocalDate.now(), "NONE", null, null, null, "BUSY"
            );
            when(userRepo.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.createEvent(userId, req))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when isAllDay is false and startTime is null")
        void createEvent_NullStartTime() {
            FixedEventRequest req = new FixedEventRequest(
                    "Title", "Notes", null, LocalTime.of(10, 0),
                    false, LocalDate.now(), "NONE", null, null, null, "BUSY"
            );
            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> service.createEvent(userId, req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("startTime and endTime are required");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when endTime is before or equal to startTime")
        void createEvent_InvalidTimeRange() {
            FixedEventRequest req = new FixedEventRequest(
                    "Title", "Notes", LocalTime.of(10, 0), LocalTime.of(9, 0),
                    false, LocalDate.now(), "NONE", null, null, null, "BUSY"
            );
            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> service.createEvent(userId, req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("endTime must be after startTime");
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when non-recurring event lacks eventDate")
        void createEvent_MissingEventDateForNonRecurring() {
            FixedEventRequest req = new FixedEventRequest(
                    "Title", "Notes", LocalTime.of(9, 0), LocalTime.of(10, 0),
                    false, null, "NONE", null, null, null, "BUSY"
            );
            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> service.createEvent(userId, req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("eventDate is required for non-recurring events");
        }

        @Test
        @DisplayName("Should throw CategoryNotFoundException when category does not belong to user")
        void createEvent_CategoryNotOwned() {
            UUID otherCatId = UUID.randomUUID();
            Category otherCat = new Category();
            otherCat.setId(otherCatId);
            otherCat.setUserId(UUID.randomUUID()); // different user

            FixedEventRequest req = new FixedEventRequest(
                    "Title", "Notes", LocalTime.of(9, 0), LocalTime.of(10, 0),
                    false, LocalDate.now(), "NONE", null, null, otherCatId, "BUSY"
            );
            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(categoryRepo.findById(otherCatId)).thenReturn(Optional.of(otherCat));

            assertThatThrownBy(() -> service.createEvent(userId, req))
                    .isInstanceOf(CategoryNotFoundException.class);
        }

        @Test
        @DisplayName("Should create timed event successfully")
        void createEvent_Success_Timed() {
            LocalDate date = LocalDate.of(2026, 8, 5);
            FixedEventRequest req = new FixedEventRequest(
                    "Gym", "Leg day", LocalTime.of(18, 0), LocalTime.of(19, 30),
                    false, date, "WEEKLY", List.of(1, 3, 5), null, categoryId, "BUSY"
            );

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(categoryRepo.findById(categoryId)).thenReturn(Optional.of(sampleCategory));

            FixedEventResponse resp = service.createEvent(userId, req);

            ArgumentCaptor<FixedEvent> captor = ArgumentCaptor.forClass(FixedEvent.class);
            verify(eventRepo).save(captor.capture());
            FixedEvent saved = captor.getValue();

            assertThat(saved.getTitle()).isEqualTo("Gym");
            assertThat(saved.getStartTime()).isEqualTo(LocalTime.of(18, 0));
            assertThat(saved.getEndTime()).isEqualTo(LocalTime.of(19, 30));
            assertThat(saved.getRecurrenceRule()).isEqualTo("1,3,5");

            assertThat(resp.title()).isEqualTo("Gym");
            assertThat(resp.occurrenceDate()).isEqualTo(date);
        }

        @Test
        @DisplayName("Should create all-day event successfully with MIN and 23:59:59 times")
        void createEvent_Success_AllDay() {
            LocalDate date = LocalDate.of(2026, 8, 10);
            FixedEventRequest req = new FixedEventRequest(
                    "Holiday", "Vacation", null, null,
                    true, date, "NONE", null, null, null, "FREE"
            );

            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));

            FixedEventResponse resp = service.createEvent(userId, req);

            ArgumentCaptor<FixedEvent> captor = ArgumentCaptor.forClass(FixedEvent.class);
            verify(eventRepo).save(captor.capture());
            FixedEvent saved = captor.getValue();

            assertThat(saved.getIsAllDay()).isTrue();
            assertThat(saved.getStartTime()).isEqualTo(LocalTime.MIN);
            assertThat(saved.getEndTime()).isEqualTo(LocalTime.of(23, 59, 59));
            assertThat(resp.availabilityStatus()).isEqualTo("FREE");
        }
    }

    @Nested
    @DisplayName("updateAllOccurrences Tests")
    class UpdateAllOccurrencesTests {

        @Test
        @DisplayName("Should throw EventNotFoundException when event does not exist")
        void updateAllOccurrences_NotFound() {
            UUID eventId = UUID.randomUUID();
            FixedEventRequest req = new FixedEventRequest(
                    "Title", "Notes", LocalTime.of(9, 0), LocalTime.of(10, 0),
                    false, LocalDate.now(), "NONE", null, null, null, "BUSY"
            );
            when(eventRepo.findById(eventId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateAllOccurrences(userId, eventId, req))
                    .isInstanceOf(EventNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw AccessDeniedException when event belongs to another user")
        void updateAllOccurrences_AccessDenied() {
            UUID eventId = UUID.randomUUID();
            User otherUser = new User();
            otherUser.setId(UUID.randomUUID());

            FixedEvent fe = FixedEvent.builder().id(eventId).user(otherUser).build();
            FixedEventRequest req = new FixedEventRequest(
                    "Title", "Notes", LocalTime.of(9, 0), LocalTime.of(10, 0),
                    false, LocalDate.now(), "NONE", null, null, null, "BUSY"
            );
            when(eventRepo.findById(eventId)).thenReturn(Optional.of(fe));

            assertThatThrownBy(() -> service.updateAllOccurrences(userId, eventId, req))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("Should update series and delete existing exceptions")
        void updateAllOccurrences_Success() {
            UUID eventId = UUID.randomUUID();
            LocalDate date = LocalDate.of(2026, 8, 5);
            FixedEvent fe = FixedEvent.builder()
                    .id(eventId)
                    .user(sampleUser)
                    .title("Old Title")
                    .eventDate(date)
                    .startTime(LocalTime.of(8, 0))
                    .endTime(LocalTime.of(9, 0))
                    .recurrenceType("NONE")
                    .build();

            FixedEventRequest req = new FixedEventRequest(
                    "New Title", "New Notes", LocalTime.of(9, 0), LocalTime.of(10, 0),
                    false, date, "NONE", null, null, categoryId, "BUSY"
            );

            when(eventRepo.findById(eventId)).thenReturn(Optional.of(fe));
            when(categoryRepo.findById(categoryId)).thenReturn(Optional.of(sampleCategory));

            FixedEventResponse resp = service.updateAllOccurrences(userId, eventId, req);

            verify(exceptionRepo).deleteAllByFixedEventId(eventId);
            verify(eventRepo).save(fe);

            assertThat(fe.getTitle()).isEqualTo("New Title");
            assertThat(fe.getNotes()).isEqualTo("New Notes");
            assertThat(resp.title()).isEqualTo("New Title");
        }
    }

    @Nested
    @DisplayName("updateSingleOccurrence Tests")
    class UpdateSingleOccurrenceTests {

        @Test
        @DisplayName("Should create new exception when none exists for occurrence date")
        void updateSingleOccurrence_CreateNewException() {
            UUID eventId = UUID.randomUUID();
            LocalDate date = LocalDate.of(2026, 8, 5);
            FixedEvent fe = FixedEvent.builder()
                    .id(eventId)
                    .user(sampleUser)
                    .title("Daily Routine")
                    .eventDate(LocalDate.of(2026, 8, 1))
                    .startTime(LocalTime.of(8, 0))
                    .endTime(LocalTime.of(9, 0))
                    .recurrenceType("DAILY")
                    .build();

            FixedEventExceptionRequest req = new FixedEventExceptionRequest(
                    "Shifted Routine", null, LocalTime.of(8, 30), LocalTime.of(9, 30),
                    null, false, categoryId, "BUSY"
            );

            when(eventRepo.findById(eventId)).thenReturn(Optional.of(fe));
            when(exceptionRepo.findByFixedEventIdAndOccurrenceDate(eventId, date)).thenReturn(Optional.empty());
            when(categoryRepo.findById(categoryId)).thenReturn(Optional.of(sampleCategory));

            FixedEventResponse resp = service.updateSingleOccurrence(userId, eventId, date, req);

            ArgumentCaptor<FixedEventException> captor = ArgumentCaptor.forClass(FixedEventException.class);
            verify(exceptionRepo).save(captor.capture());
            FixedEventException savedEx = captor.getValue();

            assertThat(savedEx.getOverrideTitle()).isEqualTo("Shifted Routine");
            assertThat(savedEx.getOverrideStartTime()).isEqualTo(LocalTime.of(8, 30));
            assertThat(resp.isException()).isTrue();
        }
    }

    @Nested
    @DisplayName("deleteAllOccurrences Tests")
    class DeleteAllOccurrencesTests {

        @Test
        @DisplayName("Should delete series entity when owned by user")
        void deleteAllOccurrences_Success() {
            UUID eventId = UUID.randomUUID();
            FixedEvent fe = FixedEvent.builder().id(eventId).user(sampleUser).build();

            when(eventRepo.findById(eventId)).thenReturn(Optional.of(fe));

            service.deleteAllOccurrences(userId, eventId);

            verify(eventRepo).delete(fe);
        }
    }

    @Nested
    @DisplayName("deleteSingleOccurrence Tests")
    class DeleteSingleOccurrenceTests {

        @Test
        @DisplayName("Should save exception with isDeleted=true")
        void deleteSingleOccurrence_Success() {
            UUID eventId = UUID.randomUUID();
            LocalDate date = LocalDate.of(2026, 8, 5);
            FixedEvent fe = FixedEvent.builder().id(eventId).user(sampleUser).build();

            when(eventRepo.findById(eventId)).thenReturn(Optional.of(fe));
            when(exceptionRepo.findByFixedEventIdAndOccurrenceDate(eventId, date)).thenReturn(Optional.empty());

            service.deleteSingleOccurrence(userId, eventId, date);

            ArgumentCaptor<FixedEventException> captor = ArgumentCaptor.forClass(FixedEventException.class);
            verify(exceptionRepo).save(captor.capture());
            assertThat(captor.getValue().getIsDeleted()).isTrue();
            assertThat(captor.getValue().getOccurrenceDate()).isEqualTo(date);
        }
    }

    @Nested
    @DisplayName("deleteFromDateOnwards Tests")
    class DeleteFromDateOnwardsTests {

        @Test
        @DisplayName("Should delete entire series when occurrenceDate <= seriesStart")
        void deleteFromDateOnwards_BeforeOrEqualStart() {
            UUID eventId = UUID.randomUUID();
            LocalDate seriesStart = LocalDate.of(2026, 8, 5);
            FixedEvent fe = FixedEvent.builder().id(eventId).user(sampleUser).eventDate(seriesStart).build();

            when(eventRepo.findById(eventId)).thenReturn(Optional.of(fe));

            service.deleteFromDateOnwards(userId, eventId, seriesStart);

            verify(eventRepo).delete(fe);
            verifyNoInteractions(exceptionRepo);
        }

        @Test
        @DisplayName("Should truncate recurrenceEndDate and delete future exceptions when occurrenceDate > seriesStart")
        void deleteFromDateOnwards_AfterStart() {
            UUID eventId = UUID.randomUUID();
            LocalDate seriesStart = LocalDate.of(2026, 8, 1);
            LocalDate occurrenceDate = LocalDate.of(2026, 8, 5);
            FixedEvent fe = FixedEvent.builder()
                    .id(eventId)
                    .user(sampleUser)
                    .eventDate(seriesStart)
                    .recurrenceType("DAILY")
                    .build();

            when(eventRepo.findById(eventId)).thenReturn(Optional.of(fe));

            service.deleteFromDateOnwards(userId, eventId, occurrenceDate);

            assertThat(fe.getRecurrenceEndDate()).isEqualTo(LocalDate.of(2026, 8, 4));
            verify(eventRepo).save(fe);
            verify(exceptionRepo).deleteByFixedEventIdAndOccurrenceDateGreaterThanEqual(eventId, occurrenceDate);
        }
    }

    @Nested
    @DisplayName("updateFromDateOnwards Tests")
    class UpdateFromDateOnwardsTests {

        @Test
        @DisplayName("Should delegate to updateAllOccurrences when occurrenceDate <= seriesStart")
        void updateFromDateOnwards_DelegatesToUpdateAll() {
            UUID eventId = UUID.randomUUID();
            LocalDate seriesStart = LocalDate.of(2026, 8, 5);
            FixedEvent fe = FixedEvent.builder()
                    .id(eventId)
                    .user(sampleUser)
                    .eventDate(seriesStart)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(10, 0))
                    .build();

            FixedEventRequest req = new FixedEventRequest(
                    "Updated", "Notes", LocalTime.of(9, 0), LocalTime.of(10, 0),
                    false, seriesStart, "NONE", null, null, null, "BUSY"
            );

            when(eventRepo.findById(eventId)).thenReturn(Optional.of(fe));

            service.updateFromDateOnwards(userId, eventId, seriesStart, req);

            verify(exceptionRepo).deleteAllByFixedEventId(eventId);
            verify(eventRepo).save(fe);
        }

        @Test
        @DisplayName("Should split series by setting recurrenceEndDate on old series and creating new series")
        void updateFromDateOnwards_SplitsSeries() {
            UUID eventId = UUID.randomUUID();
            LocalDate seriesStart = LocalDate.of(2026, 8, 1);
            LocalDate occurrenceDate = LocalDate.of(2026, 8, 5);

            FixedEvent fe = FixedEvent.builder()
                    .id(eventId)
                    .user(sampleUser)
                    .eventDate(seriesStart)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(10, 0))
                    .recurrenceType("DAILY")
                    .build();

            FixedEventRequest req = new FixedEventRequest(
                    "New Series Title", "Notes", LocalTime.of(10, 0), LocalTime.of(11, 0),
                    false, occurrenceDate, "DAILY", null, null, null, "BUSY"
            );

            when(eventRepo.findById(eventId)).thenReturn(Optional.of(fe));
            when(userRepo.findById(userId)).thenReturn(Optional.of(sampleUser));

            FixedEventResponse resp = service.updateFromDateOnwards(userId, eventId, occurrenceDate, req);

            assertThat(fe.getRecurrenceEndDate()).isEqualTo(LocalDate.of(2026, 8, 4));
            verify(eventRepo).save(fe);
            verify(exceptionRepo).deleteByFixedEventIdAndOccurrenceDateGreaterThanEqual(eventId, occurrenceDate);

            // New series saved
            verify(eventRepo, times(2)).save(any(FixedEvent.class));
            assertThat(resp.title()).isEqualTo("New Series Title");
        }
    }
}
