package nhk.calendar;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public interface DailyCheckinService {
    AvailableTimeResponse checkin(UUID userId, LocalDate date, LocalTime checkinTime);
}
