package nhk.timecontext;

import java.util.List;
import java.util.UUID;

public interface TimeContextService {
    List<TimeContextDto> getTimeContexts(UUID userId);
    TimeContextDto getTimeContext(UUID id, UUID userId);
    TimeContextDto createTimeContext(TimeContextCreateRequest request, UUID userId);
    TimeContextDto updateTimeContext(UUID id, TimeContextUpdateRequest request, UUID userId);
    void deleteTimeContext(UUID id, UUID userId);
}
