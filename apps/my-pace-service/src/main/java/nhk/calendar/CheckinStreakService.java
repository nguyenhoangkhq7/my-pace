package nhk.calendar;

import java.time.ZoneId;
import java.util.UUID;

public interface CheckinStreakService {
    int getStreak(UUID userId, ZoneId zoneId);
}
