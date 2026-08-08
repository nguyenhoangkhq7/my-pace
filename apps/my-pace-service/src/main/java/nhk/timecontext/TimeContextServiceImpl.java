package nhk.timecontext;

import lombok.RequiredArgsConstructor;
import nhk.category.Category;
import nhk.category.CategoryRepository;
import nhk.common.TimeContextNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimeContextServiceImpl implements TimeContextService {
    private final TimeContextRepository timeContextRepository;
    private final CategoryRepository categoryRepository;
    private final TimeContextMapper timeContextMapper;

    @Override
    @Transactional(readOnly = true)
    public List<TimeContextDto> getTimeContexts(UUID userId) {
        return timeContextRepository.findByUserIdOrderByNameAsc(userId)
                .stream()
                .map(timeContextMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TimeContextDto getTimeContext(UUID id, UUID userId) {
        TimeContext timeContext = timeContextRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new TimeContextNotFoundException("Time Context not found with ID: " + id));
        return timeContextMapper.toDto(timeContext);
    }

    @Override
    @Transactional
    public TimeContextDto createTimeContext(TimeContextCreateRequest request, UUID userId) {
        TimeContext timeContext = new TimeContext();
        timeContext.setUserId(userId);
        timeContext.setName(request.name());

        if (request.slots() != null) {
            for (TimeContextSlotDto slotDto : request.slots()) {
                validateSlot(slotDto);
                TimeContextSlot slot = timeContextMapper.toSlotEntity(slotDto);
                slot.setTimeContext(timeContext);
                timeContext.getSlots().add(slot);
            }
        }

        TimeContext savedContext = timeContextRepository.save(timeContext);

        if (request.categoryIds() != null && !request.categoryIds().isEmpty()) {
            assignCategoriesToContext(savedContext, request.categoryIds(), userId);
        }

        return timeContextMapper.toDto(savedContext);
    }

    @Override
    @Transactional
    public TimeContextDto updateTimeContext(UUID id, TimeContextUpdateRequest request, UUID userId) {
        TimeContext timeContext = timeContextRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new TimeContextNotFoundException("Time Context not found with ID: " + id));

        timeContext.setName(request.name());

        timeContext.getSlots().clear();
        if (request.slots() != null) {
            for (TimeContextSlotDto slotDto : request.slots()) {
                validateSlot(slotDto);
                TimeContextSlot slot = timeContextMapper.toSlotEntity(slotDto);
                slot.setTimeContext(timeContext);
                timeContext.getSlots().add(slot);
            }
        }

        TimeContext savedContext = timeContextRepository.save(timeContext);

        // Reset previous categories
        categoryRepository.clearTimeContextId(id);

        if (request.categoryIds() != null && !request.categoryIds().isEmpty()) {
            assignCategoriesToContext(savedContext, request.categoryIds(), userId);
        }

        return timeContextMapper.toDto(savedContext);
    }

    @Override
    @Transactional
    public void deleteTimeContext(UUID id, UUID userId) {
        TimeContext timeContext = timeContextRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new TimeContextNotFoundException("Time Context not found with ID: " + id));

        categoryRepository.clearTimeContextId(id);
        timeContextRepository.delete(timeContext);
    }

    private void validateSlot(TimeContextSlotDto slotDto) {
        if (slotDto.startTime() != null && slotDto.endTime() != null) {
            if (!slotDto.startTime().isBefore(slotDto.endTime())) {
                throw new IllegalArgumentException("Start time must be before end time for time slot");
            }
        }
    }

    private void assignCategoriesToContext(TimeContext context, List<UUID> categoryIds, UUID userId) {
        List<Category> categories = categoryRepository.findByUserIdAndIdIn(userId, categoryIds);
        for (Category category : categories) {
            category.setTimeContext(context);
        }
        categoryRepository.saveAll(categories);
        context.setCategories(categories);
    }

}
