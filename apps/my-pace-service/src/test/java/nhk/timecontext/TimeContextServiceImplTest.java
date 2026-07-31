package nhk.timecontext;

import nhk.category.Category;
import nhk.category.CategoryDto;
import nhk.category.CategoryMapper;
import nhk.category.CategoryRepository;
import nhk.common.TimeContextNotFoundException;
import org.junit.jupiter.api.BeforeEach;
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

    @Mock
    private CategoryMapper categoryMapper;

    @InjectMocks
    private TimeContextServiceImpl timeContextService;

    private UUID userId;
    private UUID contextId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        contextId = UUID.randomUUID();
    }

    @Test
    void createTimeContext_success() {
        TimeContextSlotDto slotDto = new TimeContextSlotDto(null, DayOfWeek.MONDAY, LocalTime.of(7, 0), LocalTime.of(9, 0));
        TimeContextCreateRequest request = new TimeContextCreateRequest("Sáng sớm", List.of(slotDto), Collections.emptyList());

        TimeContext savedEntity = new TimeContext();
        savedEntity.setId(contextId);
        savedEntity.setUserId(userId);
        savedEntity.setName("Sáng sớm");

        when(timeContextMapper.toSlotEntity(any())).thenReturn(new TimeContextSlot());
        when(timeContextRepository.save(any(TimeContext.class))).thenReturn(savedEntity);
        when(timeContextMapper.toDto(any(TimeContext.class))).thenReturn(new TimeContextDto(contextId, "Sáng sớm", List.of(slotDto), Collections.emptyList()));

        TimeContextDto dto = timeContextService.createTimeContext(request, userId);

        assertNotNull(dto);
        assertEquals("Sáng sớm", dto.name());
        verify(timeContextRepository, times(1)).save(any(TimeContext.class));
    }

    @Test
    void createTimeContext_invalidTimeSlot_throwsException() {
        TimeContextSlotDto invalidSlot = new TimeContextSlotDto(null, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(7, 0));
        TimeContextCreateRequest request = new TimeContextCreateRequest("Invalid Slot", List.of(invalidSlot), Collections.emptyList());

        assertThrows(IllegalArgumentException.class, () -> timeContextService.createTimeContext(request, userId));
    }

    @Test
    void deleteTimeContext_success() {
        TimeContext context = new TimeContext();
        context.setId(contextId);
        context.setUserId(userId);

        when(timeContextRepository.findByIdAndUserId(contextId, userId)).thenReturn(Optional.of(context));

        timeContextService.deleteTimeContext(contextId, userId);

        verify(categoryRepository, times(1)).clearTimeContextId(contextId);
        verify(timeContextRepository, times(1)).delete(context);
    }

    @Test
    void deleteTimeContext_notFound_throwsException() {
        when(timeContextRepository.findByIdAndUserId(contextId, userId)).thenReturn(Optional.empty());

        assertThrows(TimeContextNotFoundException.class, () -> timeContextService.deleteTimeContext(contextId, userId));
    }
}
