package nhk.scheduling;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.BitSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class InMemoryBitmapScheduler {

    private final Map<String, BitSet> store = new ConcurrentHashMap<>();

    public record ScheduleGap(int startMin, int endMin, int durationMin) {}

    public String buildKey(UUID userId, LocalDate date) {
        return "user:" + userId + ":schedule:" + date.toString();
    }

    /**
     * Marks a minute range [startMin, endMin) as busy (bit = 1).
     */
    public void markRangeBusy(UUID userId, LocalDate date, int startMin, int endMin) {
        if (startMin >= endMin) return;
        if (startMin >= 1440) {
            markRangeBusy(userId, date.plusDays(1), startMin - 1440, endMin - 1440);
            return;
        }
        if (endMin > 1440) {
            markRangeBusy(userId, date, startMin, 1440);
            markRangeBusy(userId, date.plusDays(1), 0, endMin - 1440);
            return;
        }
        String key = buildKey(userId, date);
        int from = Math.max(0, startMin);
        int to = Math.min(1440, endMin);

        BitSet bitSet = store.computeIfAbsent(key, k -> new BitSet(1440));
        bitSet.set(from, to, true);
    }

    /**
     * Clears the schedule bitmap for a user and date.
     */
    public void clearSchedule(UUID userId, LocalDate date) {
        String key = buildKey(userId, date);
        store.remove(key);
    }

    public boolean isBusy(UUID userId, LocalDate date, int min) {
        if (min < 0) return true;
        if (min >= 1440) {
            return isBusy(userId, date.plusDays(1), min - 1440);
        }
        String key = buildKey(userId, date);
        BitSet bitSet = store.get(key);
        return bitSet != null && bitSet.get(min);
    }

    /**
     * Scans bitmap for available free gaps >= minChunkMinutes between windowStartMin and windowEndMin.
     */
    public List<ScheduleGap> findFreeGaps(UUID userId, LocalDate date, int windowStartMin, int windowEndMin, int minChunkMinutes) {
        List<ScheduleGap> gaps = new ArrayList<>();
        int gapStart = -1;

        int from = Math.max(0, windowStartMin);
        int to = Math.max(0, windowEndMin);

        for (int m = from; m < to; m++) {
            boolean busy = isBusy(userId, date, m);
            if (!busy) {
                if (gapStart == -1) {
                    gapStart = m;
                }
            } else {
                if (gapStart != -1) {
                    int duration = m - gapStart;
                    if (duration >= minChunkMinutes) {
                        gaps.add(new ScheduleGap(gapStart, m, duration));
                    }
                    gapStart = -1;
                }
            }
        }

        if (gapStart != -1) {
            int duration = to - gapStart;
            if (duration >= minChunkMinutes) {
                gaps.add(new ScheduleGap(gapStart, to, duration));
            }
        }

        return gaps;
    }
}
