package nhk.calendar;

import java.time.LocalDate;
import java.util.UUID;

public interface AvailableTimeService {
    AvailableTimeResponse getAvailableTime(UUID userId, LocalDate date);
}
