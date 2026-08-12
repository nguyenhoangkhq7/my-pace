package nhk.calendar;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

/**
 * Calculates the user's consecutive daily check-in streak.
 * A streak is still alive if the user checked in yesterday (but not yet today).
 */
@Service
@RequiredArgsConstructor
public class CheckinStreakServiceImpl implements CheckinStreakService {

    private final DailyCheckinRepository checkinRepo;

    @Override
    @Transactional(readOnly = true)
    public int getStreak(UUID userId, ZoneId zoneId) {
        LocalDate today = LocalDate.now(zoneId);
        List<DailyCheckin> checkins = checkinRepo.findByUserIdOrderByCheckinDateDesc(userId);

        if (checkins.isEmpty()) return 0;

        // Single pass: find anchor (today or yesterday) then count consecutive days backward
        LocalDate cursor = null;
        for (DailyCheckin dc : checkins) {
            LocalDate d = dc.getCheckinDate();
            if (d.equals(today) || d.equals(today.minusDays(1))) {
                cursor = d;
                break;
            }
            if (d.isBefore(today.minusDays(1))) return 0; // gap found immediately
        }
        if (cursor == null) return 0;

        int streak = 0;
        for (DailyCheckin dc : checkins) {
            LocalDate d = dc.getCheckinDate();
            if (d.equals(cursor)) {
                streak++;
                cursor = cursor.minusDays(1);
            } else if (d.isBefore(cursor)) {
                break;
            }
        }
        return streak;
    }
}
