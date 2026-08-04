package nhk.stats;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import nhk.calendar.FixedEventResponse;
import nhk.calendar.FixedEventService;
import nhk.category.Category;
import nhk.category.CategoryDto;
import nhk.common.UserNotFoundException;
import nhk.user.User;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StatsServiceImplTest {

    @Mock
    private EntityManager entityManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FixedEventService fixedEventService;

    @Mock
    private TypedQuery<Object[]> matrixTypedQuery;

    @Mock
    private TypedQuery<Category> categoryListTypedQuery;

    @Mock
    private TypedQuery<Object[]> categorySumTypedQuery;

    @Mock
    private TypedQuery<Long> totalPlanTypedQuery;

    @Mock
    private TypedQuery<Long> donePlanTypedQuery;

    @Mock
    private TypedQuery<LocalDate> checkinTypedQuery;

    @InjectMocks
    private StatsServiceImpl statsService;

    private UUID userId;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        sampleUser = new User();
        sampleUser.setId(userId);
        sampleUser.setEmail("user@example.com");
        sampleUser.setTimezone("UTC");

        org.springframework.test.util.ReflectionTestUtils.setField(statsService, "entityManager", entityManager);
    }

    private void mockDefaultEntityManagerQueries() {
        // 1. Matrix query
        when(entityManager.createQuery(contains("t.isUrgent, t.isImportant"), eq(Object[].class)))
                .thenReturn(matrixTypedQuery);
        when(matrixTypedQuery.setParameter(anyString(), any())).thenReturn(matrixTypedQuery);
        when(matrixTypedQuery.getResultList()).thenReturn(Collections.emptyList());

        // 2. Categories list query
        when(entityManager.createQuery(contains("FROM Category c"), eq(Category.class)))
                .thenReturn(categoryListTypedQuery);
        when(categoryListTypedQuery.setParameter(anyString(), any())).thenReturn(categoryListTypedQuery);
        when(categoryListTypedQuery.getResultList()).thenReturn(Collections.emptyList());

        // Category sum query
        when(entityManager.createQuery(contains("SELECT c.name,"), eq(Object[].class)))
                .thenReturn(categorySumTypedQuery);
        when(categorySumTypedQuery.setParameter(anyString(), any())).thenReturn(categorySumTypedQuery);
        when(categorySumTypedQuery.getResultList()).thenReturn(Collections.emptyList());

        // 3. Plan Completion Rate queries
        when(entityManager.createQuery(contains("SELECT COUNT(dpt.id) FROM DailyPlanTask dpt, DailyPlan dp"), eq(Long.class)))
                .thenReturn(totalPlanTypedQuery);
        when(totalPlanTypedQuery.setParameter(anyString(), any())).thenReturn(totalPlanTypedQuery);
        when(totalPlanTypedQuery.getSingleResult()).thenReturn(0L);

        when(entityManager.createQuery(contains("SELECT COUNT(dpt.id) FROM DailyPlanTask dpt JOIN dpt.task t, DailyPlan dp"), eq(Long.class)))
                .thenReturn(donePlanTypedQuery);
        when(donePlanTypedQuery.setParameter(anyString(), any())).thenReturn(donePlanTypedQuery);
        when(donePlanTypedQuery.getSingleResult()).thenReturn(0L);

        // 4. Streak query
        when(entityManager.createQuery(contains("SELECT dc.checkinDate FROM DailyCheckin dc"), eq(LocalDate.class)))
                .thenReturn(checkinTypedQuery);
        when(checkinTypedQuery.setParameter(anyString(), any())).thenReturn(checkinTypedQuery);
        when(checkinTypedQuery.getResultList()).thenReturn(Collections.emptyList());

        // Fixed events service default empty
        when(fixedEventService.getEventsInRange(any(), any(), any())).thenReturn(Collections.emptyList());
    }

    @Test
    @DisplayName("getOverview throws UserNotFoundException when user is not found")
    void getOverview_UserNotFound_ThrowsException() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () ->
                statsService.getOverview(userId, "2026-07-01", "2026-07-31")
        );

        verify(userRepository).findById(userId);
    }

    @Test
    @DisplayName("getOverview succeeds with default UTC timezone when user timezone is null or blank")
    void getOverview_DefaultTimezone_Success() {
        sampleUser.setTimezone(null);
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        mockDefaultEntityManagerQueries();

        StatsResponse response = statsService.getOverview(userId, null, null);

        assertNotNull(response);
        assertEquals(0, response.streak());
        assertEquals(0.0, response.completionRate());
    }

    @Test
    @DisplayName("getOverview succeeds with custom valid date range and custom timezone")
    void getOverview_CustomTimezoneAndValidDates_Success() {
        sampleUser.setTimezone("Asia/Ho_Chi_Minh");
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        mockDefaultEntityManagerQueries();

        StatsResponse response = statsService.getOverview(userId, "2026-07-01", "2026-07-15");

        assertNotNull(response);
        verify(userRepository).findById(userId);
    }

    @Test
    @DisplayName("getOverview falls back to default 30-day range when date string is invalid")
    void getOverview_InvalidDateString_FallbackToDefaultRange() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        mockDefaultEntityManagerQueries();

        StatsResponse response = statsService.getOverview(userId, "invalid-date", "2026-07-15");

        assertNotNull(response);
    }

    @Test
    @DisplayName("getOverview calculates Matrix Time correctly for all 4 quadrants")
    void getOverview_MatrixTime_AllQuadrants() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        mockDefaultEntityManagerQueries();

        List<Object[]> matrixResults = List.of(
                new Object[]{true, true, 60L},   // q1: Urgent & Important
                new Object[]{false, true, 120L}, // q2: Not Urgent & Important
                new Object[]{true, false, 45L},  // q3: Urgent & Not Important
                new Object[]{false, false, 15L}  // q4: Not Urgent & Not Important
        );
        when(matrixTypedQuery.getResultList()).thenReturn(matrixResults);

        StatsResponse response = statsService.getOverview(userId, null, null);

        assertNotNull(response);
        assertEquals(60, response.matrixTime().get("q1"));
        assertEquals(120, response.matrixTime().get("q2"));
        assertEquals(45, response.matrixTime().get("q3"));
        assertEquals(15, response.matrixTime().get("q4"));
    }

    @Test
    @DisplayName("getOverview calculates Category Time including null categories and fixed events")
    void getOverview_CategoryTime_IncludesCategoriesAndFixedEvents() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        mockDefaultEntityManagerQueries();

        Category workCat = new Category();
        workCat.setName("Work");
        when(categoryListTypedQuery.getResultList()).thenReturn(List.of(workCat));

        List<Object[]> categoryTaskResults = List.of(
                new Object[]{"Work", 90L},
                new Object[]{null, 30L} // null category -> "Chưa phân loại"
        );
        when(categorySumTypedQuery.getResultList()).thenReturn(categoryTaskResults);

        // Fixed event with category "Work" (60 min)
        CategoryDto workCatDto = new CategoryDto(UUID.randomUUID(), "Work", "#000000", null);
        FixedEventResponse feWork = FixedEventResponse.builder()
                .startTime(java.time.LocalTime.of(9, 0))
                .endTime(java.time.LocalTime.of(10, 0))
                .category(workCatDto)
                .build();

        // Fixed event with null category (30 min) -> "Chưa phân loại"
        FixedEventResponse feUnclassified = FixedEventResponse.builder()
                .startTime(java.time.LocalTime.of(14, 0))
                .endTime(java.time.LocalTime.of(14, 30))
                .category(null)
                .build();

        when(fixedEventService.getEventsInRange(any(), any(), any()))
                .thenReturn(List.of(feWork, feUnclassified));

        StatsResponse response = statsService.getOverview(userId, null, null);

        assertNotNull(response);
        // Work: 90 (tasks) + 60 (fixed event) = 150
        assertEquals(150, response.categoryTime().get("Work"));
        // Chưa phân loại: 30 (tasks) + 30 (fixed event) = 60
        assertEquals(60, response.categoryTime().get("Chưa phân loại"));
    }

    @Test
    @DisplayName("getOverview calculates Plan Completion Rate and rounds to 1 decimal place")
    void getOverview_CompletionRate_CalculatedAndRounded() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        mockDefaultEntityManagerQueries();

        // 3 total, 2 done -> 2/3 * 100 = 66.6666... -> 66.7
        when(totalPlanTypedQuery.getSingleResult()).thenReturn(3L);
        when(donePlanTypedQuery.getSingleResult()).thenReturn(2L);

        StatsResponse response = statsService.getOverview(userId, null, null);

        assertNotNull(response);
        assertEquals(66.7, response.completionRate());
    }

    @Test
    @DisplayName("getOverview calculates Streak when checked in today and previous days")
    void getOverview_Streak_CheckedInToday() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        mockDefaultEntityManagerQueries();

        LocalDate today = LocalDate.now(ZoneId.of("UTC"));
        List<LocalDate> checkins = List.of(
                today,
                today.minusDays(1),
                today.minusDays(2)
        );
        when(checkinTypedQuery.getResultList()).thenReturn(checkins);

        StatsResponse response = statsService.getOverview(userId, null, null);

        assertNotNull(response);
        assertEquals(3, response.streak());
    }

    @Test
    @DisplayName("getOverview calculates Streak when checked in yesterday but not yet today")
    void getOverview_Streak_CheckedInYesterdayNotToday() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        mockDefaultEntityManagerQueries();

        LocalDate today = LocalDate.now(ZoneId.of("UTC"));
        List<LocalDate> checkins = List.of(
                today.minusDays(1),
                today.minusDays(2)
        );
        when(checkinTypedQuery.getResultList()).thenReturn(checkins);

        StatsResponse response = statsService.getOverview(userId, null, null);

        assertNotNull(response);
        assertEquals(2, response.streak());
    }

    @Test
    @DisplayName("getOverview sets Streak to 0 when missing checkins for both today and yesterday")
    void getOverview_Streak_MissingTodayAndYesterday() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        mockDefaultEntityManagerQueries();

        LocalDate today = LocalDate.now(ZoneId.of("UTC"));
        List<LocalDate> checkins = List.of(
                today.minusDays(2),
                today.minusDays(3)
        );
        when(checkinTypedQuery.getResultList()).thenReturn(checkins);

        StatsResponse response = statsService.getOverview(userId, null, null);

        assertNotNull(response);
        assertEquals(0, response.streak());
    }
}
