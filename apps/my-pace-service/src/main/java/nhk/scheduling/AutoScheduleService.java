package nhk.scheduling;

import java.util.UUID;

public interface AutoScheduleService {
    AutoScheduleResponse autoSchedule(UUID userId, Integer bufferMinutes);
}

