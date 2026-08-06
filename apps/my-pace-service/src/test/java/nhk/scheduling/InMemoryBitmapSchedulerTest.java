package nhk.scheduling;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class InMemoryBitmapSchedulerTest {

    private InMemoryBitmapScheduler scheduler;
    private final UUID userId = UUID.randomUUID();
    private final LocalDate today = LocalDate.of(2026, 8, 2);
    private final ZoneId zoneId = ZoneId.of("Asia/Ho_Chi_Minh");

    @BeforeEach
    void setUp() {
        scheduler = new InMemoryBitmapScheduler();
    }

    @Test
    @DisplayName("buildKey returns correct formatted string")
    void testBuildKey() {
        String key = scheduler.buildKey(userId, today);
        assertEquals("user:" + userId + ":schedule:2026-08-02", key);
    }

    @Test
    @DisplayName("findFreeGaps when no busy range returns full gap")
    void testFindFreeGaps_NoBusyRange_ReturnsFullWindowGap() {
        List<InMemoryBitmapScheduler.ScheduleGap> gaps = scheduler.findFreeGaps(userId, today, 480, 1000, 30);
        
        assertEquals(1, gaps.size());
        assertEquals(480, gaps.get(0).startMin());
        assertEquals(1000, gaps.get(0).endMin());
        assertEquals(520, gaps.get(0).durationMin());
    }

    @Test
    @DisplayName("markRangeBusy splits free gaps around busy interval")
    void testMarkRangeBusy_SplitsGaps() {
        // Mark 540 to 600 (9:00 - 10:00) as busy
        scheduler.markRangeBusy(userId, today, 540, 600);

        List<InMemoryBitmapScheduler.ScheduleGap> gaps = scheduler.findFreeGaps(userId, today, 480, 720, 30);

        assertEquals(2, gaps.size());
        
        // Gap 1: 480 to 540 (duration 60)
        assertEquals(480, gaps.get(0).startMin());
        assertEquals(540, gaps.get(0).endMin());
        assertEquals(60, gaps.get(0).durationMin());

        // Gap 2: 600 to 720 (duration 120)
        assertEquals(600, gaps.get(1).startMin());
        assertEquals(720, gaps.get(1).endMin());
        assertEquals(120, gaps.get(1).durationMin());
    }

    @Test
    @DisplayName("markRangeBusy with startMin >= endMin does nothing")
    void testMarkRangeBusy_InvalidRange_NoChange() {
        scheduler.markRangeBusy(userId, today, 600, 500);
        scheduler.markRangeBusy(userId, today, 600, 600);

        List<InMemoryBitmapScheduler.ScheduleGap> gaps = scheduler.findFreeGaps(userId, today, 480, 720, 30);
        assertEquals(1, gaps.size());
        assertEquals(480, gaps.get(0).startMin());
        assertEquals(720, gaps.get(0).endMin());
    }

    @Test
    @DisplayName("markRangeBusy out of bounds clamped to 0..1440")
    void testMarkRangeBusy_OutOfBoundsClamped() {
        scheduler.markRangeBusy(userId, today, -50, 1500);

        List<InMemoryBitmapScheduler.ScheduleGap> gaps = scheduler.findFreeGaps(userId, today, 0, 1440, 15);
        assertTrue(gaps.isEmpty());
    }

    @Test
    @DisplayName("findFreeGaps filters out gaps smaller than minChunkMinutes")
    void testFindFreeGaps_MinChunkFilter() {
        // Mark 500..550 busy, leaving 480..500 (20 min gap)
        scheduler.markRangeBusy(userId, today, 500, 550);

        // Require minimum 30 min chunk
        List<InMemoryBitmapScheduler.ScheduleGap> gaps = scheduler.findFreeGaps(userId, today, 480, 720, 30);

        assertEquals(1, gaps.size());
        assertEquals(550, gaps.get(0).startMin());
        assertEquals(720, gaps.get(0).endMin());
    }

    @Test
    @DisplayName("clearSchedule removes busy slots for user and date")
    void testClearSchedule() {
        scheduler.markRangeBusy(userId, today, 0, 1440);
        List<InMemoryBitmapScheduler.ScheduleGap> gapsBefore = scheduler.findFreeGaps(userId, today, 480, 720, 30);
        assertTrue(gapsBefore.isEmpty());

        scheduler.clearSchedule(userId, today);
        List<InMemoryBitmapScheduler.ScheduleGap> gapsAfter = scheduler.findFreeGaps(userId, today, 480, 720, 30);
        assertEquals(1, gapsAfter.size());
        assertEquals(480, gapsAfter.get(0).startMin());
        assertEquals(720, gapsAfter.get(0).endMin());
    }
}
