package nhk.timecontext;

import nhk.category.Category;
import nhk.category.CategoryRepository;
import nhk.common.TimeContextNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TimeContextServiceImplTest {

    @Mock
    private TimeContextRepository timeContextRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private TimeContextMapper timeContextMapper;

    @InjectMocks
    private TimeContextServiceImpl timeContextService;

    private UUID userId;
    private UUID contextId;
    private TimeContext sampleEntity;
    private TimeContextDto sampleDto;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        contextId = UUID.randomUUID();

        sampleEntity = new TimeContext();
        sampleEntity.setId(contextId);
        sampleEntity.setUserId(userId);
        sampleEntity.setName("Work Context");

        sampleDto = new TimeContextDto(contextId, "Work Context", Collections.emptyList(), Collections.emptyList());
    }

    @Test
    @DisplayName("getTimeContexts should return list of TimeContextDto for user")
    void getTimeContexts_success() {
        when(timeContextRepository.findByUserIdOrderByNameAsc(userId)).thenReturn(List.of(sampleEntity));
        when(timeContextMapper.toDto(sampleEntity)).thenReturn(sampleDto);

        List<TimeContextDto> result = timeContextService.getTimeContexts(userId);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Work Context", result.get(0).name());
        verify(timeContextRepository, times(1)).findByUserIdOrderByNameAsc(userId);
        verify(timeContextMapper, times(1)).toDto(sampleEntity);
    }

    @Test
    @DisplayName("getTimeContexts should return empty list when no contexts found")
    void getTimeContexts_empty() {
        when(timeContextRepository.findByUserIdOrderByNameAsc(userId)).thenReturn(Collections.emptyList());

        List<TimeContextDto> result = timeContextService.getTimeContexts(userId);

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(timeContextRepository, times(1)).findByUserIdOrderByNameAsc(userId);
        verify(timeContextMapper, never()).toDto(any());
    }

    @Test
    @DisplayName("getTimeContext should return TimeContextDto when context exists")
    void getTimeContext_success() {
        when(timeContextRepository.findByIdAndUserId(contextId, userId)).thenReturn(Optional.of(sampleEntity));
        when(timeContextMapper.toDto(sampleEntity)).thenReturn(sampleDto);

        TimeContextDto result = timeContextService.getTimeContext(contextId, userId);

        assertNotNull(result);
        assertEquals(contextId, result.id());
        assertEquals("Work Context", result.name());
        verify(timeContextRepository, times(1)).findByIdAndUserId(contextId, userId);
    }

    @Test
    @DisplayName("getTimeContext should throw TimeContextNotFoundException when context does not exist")
    void getTimeContext_notFound_throwsException() {
        when(timeContextRepository.findByIdAndUserId(contextId, userId)).thenReturn(Optional.empty());

        assertThrows(TimeContextNotFoundException.class,
                () -> timeContextService.getTimeContext(contextId, userId));
        verify(timeContextRepository, times(1)).findByIdAndUserId(contextId, userId);
    }

    @Test
    @DisplayName("createTimeContext should save context with valid slots and assign categories")
    void createTimeContext_success_withSlotsAndCategories() {
        UUID catId1 = UUID.randomUUID();
        UUID catId2 = UUID.randomUUID();
        TimeContextSlotDto slotDto = new TimeContextSlotDto(null, DayOfWeek.MONDAY, LocalTime.of(8, 0), LocalTime.of(12, 0));
        TimeContextCreateRequest request = new TimeContextCreateRequest("Focus Time", List.of(slotDto), List.of(catId1, catId2));

        TimeContextSlot slotEntity = new TimeContextSlot();
        slotEntity.setDayOfWeek(DayOfWeek.MONDAY);
        slotEntity.setStartTime(LocalTime.of(8, 0));
        slotEntity.setEndTime(LocalTime.of(12, 0));

        Category cat1 = new Category();
        cat1.setId(catId1);
        cat1.setUserId(userId);
        Category cat2 = new Category();
        cat2.setId(catId2);
        cat2.setUserId(userId);

        when(timeContextMapper.toSlotEntity(slotDto)).thenReturn(slotEntity);
        when(timeContextRepository.save(any(TimeContext.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(categoryRepository.findByUserIdAndIdIn(userId, List.of(catId1, catId2))).thenReturn(List.of(cat1, cat2));
        when(timeContextMapper.toDto(any(TimeContext.class))).thenReturn(new TimeContextDto(contextId, "Focus Time", List.of(slotDto), Collections.emptyList()));

        TimeContextDto result = timeContextService.createTimeContext(request, userId);

        assertNotNull(result);
        assertEquals("Focus Time", result.name());
        verify(timeContextRepository, times(1)).save(any(TimeContext.class));
        verify(categoryRepository, times(1)).findByUserIdAndIdIn(userId, List.of(catId1, catId2));
        verify(categoryRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("createTimeContext should create context without slots or categoryIds")
    void createTimeContext_success_withoutSlotsAndCategories() {
        TimeContextCreateRequest request = new TimeContextCreateRequest("Simple Context", null, null);

        when(timeContextRepository.save(any(TimeContext.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(timeContextMapper.toDto(any(TimeContext.class))).thenReturn(new TimeContextDto(contextId, "Simple Context", Collections.emptyList(), Collections.emptyList()));

        TimeContextDto result = timeContextService.createTimeContext(request, userId);

        assertNotNull(result);
        assertEquals("Simple Context", result.name());
        verify(timeContextRepository, times(1)).save(any(TimeContext.class));
        verify(categoryRepository, never()).findByUserIdAndIdIn(any(), any());
    }

    @Test
    @DisplayName("createTimeContext should throw IllegalArgumentException when startTime equals endTime")
    void createTimeContext_startTimeEqualsEndTime_throwsException() {
        TimeContextSlotDto invalidSlot = new TimeContextSlotDto(null, DayOfWeek.MONDAY, LocalTime.of(10, 0), LocalTime.of(10, 0));
        TimeContextCreateRequest request = new TimeContextCreateRequest("Invalid Time", List.of(invalidSlot), Collections.emptyList());

        assertThrows(IllegalArgumentException.class, () -> timeContextService.createTimeContext(request, userId));
        verify(timeContextRepository, never()).save(any());
    }

    @Test
    @DisplayName("createTimeContext should throw IllegalArgumentException when startTime is after endTime")
    void createTimeContext_startTimeAfterEndTime_throwsException() {
        TimeContextSlotDto invalidSlot = new TimeContextSlotDto(null, DayOfWeek.MONDAY, LocalTime.of(14, 0), LocalTime.of(10, 0));
        TimeContextCreateRequest request = new TimeContextCreateRequest("Invalid Time", List.of(invalidSlot), Collections.emptyList());

        assertThrows(IllegalArgumentException.class, () -> timeContextService.createTimeContext(request, userId));
        verify(timeContextRepository, never()).save(any());
    }

    @Test
    @DisplayName("createTimeContext should not throw validation error when startTime or endTime is null")
    void createTimeContext_slotWithNullStartOrEndTime_success() {
        TimeContextSlotDto slotDto = new TimeContextSlotDto(null, DayOfWeek.MONDAY, null, LocalTime.of(10, 0));
        TimeContextCreateRequest request = new TimeContextCreateRequest("Partial Time Slot", List.of(slotDto), Collections.emptyList());

        when(timeContextMapper.toSlotEntity(slotDto)).thenReturn(new TimeContextSlot());
        when(timeContextRepository.save(any(TimeContext.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(timeContextMapper.toDto(any(TimeContext.class))).thenReturn(new TimeContextDto(contextId, "Partial Time Slot", List.of(slotDto), Collections.emptyList()));

        TimeContextDto result = timeContextService.createTimeContext(request, userId);

        assertNotNull(result);
        verify(timeContextRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("updateTimeContext should update context name, slots, clear old categories and assign new categories")
    void updateTimeContext_success_withSlotsAndCategories() {
        UUID catId = UUID.randomUUID();
        TimeContextSlotDto slotDto = new TimeContextSlotDto(UUID.randomUUID(), DayOfWeek.TUESDAY, LocalTime.of(9, 0), LocalTime.of(17, 0));
        TimeContextUpdateRequest request = new TimeContextUpdateRequest("Updated Name", List.of(slotDto), List.of(catId));

        TimeContextSlot slotEntity = new TimeContextSlot();
        Category cat = new Category();
        cat.setId(catId);

        when(timeContextRepository.findByIdAndUserId(contextId, userId)).thenReturn(Optional.of(sampleEntity));
        when(timeContextMapper.toSlotEntity(slotDto)).thenReturn(slotEntity);
        when(timeContextRepository.save(sampleEntity)).thenReturn(sampleEntity);
        when(categoryRepository.findByUserIdAndIdIn(userId, List.of(catId))).thenReturn(List.of(cat));
        when(timeContextMapper.toDto(sampleEntity)).thenReturn(new TimeContextDto(contextId, "Updated Name", List.of(slotDto), Collections.emptyList()));

        TimeContextDto result = timeContextService.updateTimeContext(contextId, request, userId);

        assertNotNull(result);
        assertEquals("Updated Name", result.name());
        verify(categoryRepository, times(1)).clearTimeContextId(contextId);
        verify(categoryRepository, times(1)).findByUserIdAndIdIn(userId, List.of(catId));
        verify(categoryRepository, times(1)).saveAll(anyList());
        verify(timeContextRepository, times(1)).save(sampleEntity);
    }

    @Test
    @DisplayName("updateTimeContext should update context when slots and categoryIds are null")
    void updateTimeContext_success_nullSlotsAndCategoryIds() {
        TimeContextUpdateRequest request = new TimeContextUpdateRequest("Updated Name Only", null, null);

        when(timeContextRepository.findByIdAndUserId(contextId, userId)).thenReturn(Optional.of(sampleEntity));
        when(timeContextRepository.save(sampleEntity)).thenReturn(sampleEntity);
        when(timeContextMapper.toDto(sampleEntity)).thenReturn(new TimeContextDto(contextId, "Updated Name Only", Collections.emptyList(), Collections.emptyList()));

        TimeContextDto result = timeContextService.updateTimeContext(contextId, request, userId);

        assertNotNull(result);
        assertEquals("Updated Name Only", result.name());
        verify(categoryRepository, times(1)).clearTimeContextId(contextId);
        verify(categoryRepository, never()).findByUserIdAndIdIn(any(), any());
    }

    @Test
    @DisplayName("updateTimeContext should throw TimeContextNotFoundException when context not found")
    void updateTimeContext_notFound_throwsException() {
        TimeContextUpdateRequest request = new TimeContextUpdateRequest("Updated Name", Collections.emptyList(), Collections.emptyList());
        when(timeContextRepository.findByIdAndUserId(contextId, userId)).thenReturn(Optional.empty());

        assertThrows(TimeContextNotFoundException.class,
                () -> timeContextService.updateTimeContext(contextId, request, userId));
        verify(timeContextRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateTimeContext should throw IllegalArgumentException when updated slot has startTime after endTime")
    void updateTimeContext_invalidTimeSlot_throwsException() {
        TimeContextSlotDto invalidSlot = new TimeContextSlotDto(null, DayOfWeek.MONDAY, LocalTime.of(15, 0), LocalTime.of(9, 0));
        TimeContextUpdateRequest request = new TimeContextUpdateRequest("Invalid Update", List.of(invalidSlot), Collections.emptyList());

        when(timeContextRepository.findByIdAndUserId(contextId, userId)).thenReturn(Optional.of(sampleEntity));

        assertThrows(IllegalArgumentException.class,
                () -> timeContextService.updateTimeContext(contextId, request, userId));
        verify(timeContextRepository, never()).save(any());
    }

    @Test
    @DisplayName("deleteTimeContext should clear category links and delete context when found")
    void deleteTimeContext_success() {
        when(timeContextRepository.findByIdAndUserId(contextId, userId)).thenReturn(Optional.of(sampleEntity));

        timeContextService.deleteTimeContext(contextId, userId);

        verify(categoryRepository, times(1)).clearTimeContextId(contextId);
        verify(timeContextRepository, times(1)).delete(sampleEntity);
    }

    @Test
    @DisplayName("deleteTimeContext should throw TimeContextNotFoundException when context not found")
    void deleteTimeContext_notFound_throwsException() {
        when(timeContextRepository.findByIdAndUserId(contextId, userId)).thenReturn(Optional.empty());

        assertThrows(TimeContextNotFoundException.class,
                () -> timeContextService.deleteTimeContext(contextId, userId));
        verify(categoryRepository, never()).clearTimeContextId(any());
        verify(timeContextRepository, never()).delete(any());
    }
}
