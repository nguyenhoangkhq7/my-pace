package nhk.scheduling;

import java.time.LocalDate;
import java.util.UUID;

public interface AutoScheduleService {
    AutoScheduleResponse autoScheduleWeek(UUID userId, LocalDate startDate, Integer bufferMinutes, Boolean singleDayOnly);
}
