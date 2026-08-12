package nhk.calendar;

import lombok.RequiredArgsConstructor;
import nhk.common.UserNotFoundException;
import nhk.user.User;
import nhk.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;

@Service
@RequiredArgsConstructor
public class AvailableTimeServiceImpl implements AvailableTimeService {

    private final UserRepository userRepo;
    private final DailyCheckinRepository checkinRepo;
    private final FixedEventService eventService;
    private final DailyPlanRepository dailyPlanRepository;
    private final CheckinStreakService streakService;

    @Override
    @Transactional(readOnly = true)
    public AvailableTimeResponse getAvailableTime(UUID userId, LocalDate date) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        ZoneId zoneId = resolveZoneId(user);
        int streak = streakService.getStreak(userId, zoneId); // compute once, reuse in every early-return

        if (user.getWakeTime() == null || user.getSleepTime() == null) {
            return zeroResponse(user, false, null, false, streak);
        }

        Optional<DailyCheckin> checkinOpt = checkinRepo.findByUserIdAndCheckinDate(userId, date);
        boolean checkedIn = checkinOpt.isPresent();
        LocalTime checkinTime = checkedIn ? checkinOpt.get().getCheckinTime() : null;

        LocalDate today = LocalDate.now(zoneId);
        LocalTime now = resolveNow(zoneId, date, userId);

        boolean isPlanConfirmed = isPlanConfirmed(date, userId, zoneId);
        boolean isCrossMidnight = isCrossMidnight(user);

        if (date.isBefore(today)) {
            return zeroResponse(user, checkedIn, checkinTime, isPlanConfirmed, streak);
        }

        if (date.equals(today) && isDayOver(now, user.getSleepTime(), user.getWakeTime(), isCrossMidnight)) {
            return zeroResponse(user, checkedIn, checkinTime, isPlanConfirmed, streak);
        }

        LocalTime windowStart = resolveWindowStart(date, today, now, user.getWakeTime());
        LocalTime windowEnd = user.getSleepTime();
        int workingWindow = computeWorkingWindow(windowStart, windowEnd, isCrossMidnight);

        if (workingWindow <= 0) {
            return zeroResponse(user, checkedIn, checkinTime, isPlanConfirmed, streak);
        }

        List<FixedEventResponse> occurrencesToday = eventService.getEventsInRange(userId, date, date);
        List<FixedEventResponse> occurrencesTomorrow = eventService.getEventsInRange(userId, date.plusDays(1), date.plusDays(1));
        
        List<FixedEventResponse> allOccurrences = new ArrayList<>(occurrencesToday);
        allOccurrences.addAll(occurrencesTomorrow);

        UnionResult unionResult = computeUnionBlockedMinutes(allOccurrences, windowStart, windowEnd, date);

        int bufferPct = user.getBufferPct();
        int availableMinutes = Math.max(0,
                (int) ((workingWindow - unionResult.totalBlockedMinutes) * (1.0 - bufferPct / 100.0)));

        return AvailableTimeResponse.builder()
                .availableMinutes(availableMinutes)
                .blockedMinutes(unionResult.totalBlockedMinutes)
                .bufferPct(bufferPct)
                .workingWindowMinutes(workingWindow)
                .checkedIn(checkedIn)
                .checkinTime(formatTime(checkinTime))
                .streak(streak)
                .blockedIntervals(unionResult.blockedIntervals)
                .isPlanConfirmed(isPlanConfirmed)
                .decayedTaskTitles(Collections.emptyList())
                .build();
    }

    // ─── Context Resolution ───────────────────────────────────────────────────────

    private ZoneId resolveZoneId(User user) {
        String tz = user.getTimezone();
        return ZoneId.of(tz != null && !tz.isBlank() ? tz : "UTC");
    }

    /**
     * Returns effective "now": if the plan is already confirmed, freeze time at the moment of confirmation.
     */
    private LocalTime resolveNow(ZoneId zoneId, LocalDate date, UUID userId) {
        return dailyPlanRepository.findByUserIdAndPlanDate(userId, date)
                .filter(p -> Boolean.TRUE.equals(p.getIsConfirmed()) && p.getConfirmedAt() != null)
                .map(p -> p.getConfirmedAt().atZoneSameInstant(zoneId).toLocalTime())
                .orElseGet(() -> LocalTime.now(zoneId));
    }

    private boolean isPlanConfirmed(LocalDate date, UUID userId, ZoneId zoneId) {
        return dailyPlanRepository.findByUserIdAndPlanDate(userId, date)
                .map(p -> Boolean.TRUE.equals(p.getIsConfirmed()))
                .orElse(false);
    }

    // ─── Window Calculation ───────────────────────────────────────────────────────

    private boolean isCrossMidnight(User user) {
        LocalTime sleep = user.getSleepTime();
        return !sleep.equals(LocalTime.MIDNIGHT) && sleep.isBefore(user.getWakeTime());
    }

    private boolean isDayOver(LocalTime now, LocalTime sleepTime, LocalTime wakeTime, boolean isCrossMidnight) {
        if (sleepTime.equals(LocalTime.MIDNIGHT)) return false;
        if (!isCrossMidnight) return now.isAfter(sleepTime);
        return now.isAfter(sleepTime) && now.isBefore(wakeTime);
    }

    private LocalTime resolveWindowStart(LocalDate date, LocalDate today, LocalTime now, LocalTime wakeTime) {
        if (!date.equals(today)) return wakeTime; // future date: always start from wake time
        return now.isBefore(wakeTime) ? wakeTime : now;
    }

    private int computeWorkingWindow(LocalTime windowStart, LocalTime windowEnd, boolean isCrossMidnight) {
        if (windowEnd.equals(LocalTime.MIDNIGHT)) {
            return 1440 - (windowStart.toSecondOfDay() / 60);
        }
        int minutes = (int) Duration.between(windowStart, windowEnd).toMinutes();
        if (minutes < 0) return isCrossMidnight ? minutes + 1440 : 0;
        return minutes;
    }

    // ─── Union-Interval Algorithm ─────────────────────────────────────────────────

    private UnionResult computeUnionBlockedMinutes(List<FixedEventResponse> occurrences,
                                                   LocalTime windowStart, LocalTime windowEnd, LocalDate baseDate) {
        List<FixedEventResponse> busyEvents = occurrences.stream()
                .filter(e -> !"FREE".equalsIgnoreCase(e.availabilityStatus()))
                .toList();

        if (busyEvents.isEmpty()) return UnionResult.empty();

        int windowStartMin  = toMinutes(windowStart);
        int windowEndMin    = toMinutes(windowEnd);
        boolean crossesMidnight = windowEnd.isBefore(windowStart);

        if (busyEvents.stream().anyMatch(e -> Boolean.TRUE.equals(e.isAllDay()))) {
            return allDayBlockedResult(windowStartMin, windowEndMin, crossesMidnight);
        }

        int effectiveEnd = crossesMidnight ? (windowEndMin + 1440) : windowEndMin;
        List<Interval> intervals = busyEvents.stream()
                .map(e -> {
                    int start = toMinutes(e.startTime());
                    int end = toMinutes(e.endTime());
                    if (end <= start && !"00:00".equals(e.endTime().toString())) {
                        end += 1440;
                    }
                    if (e.occurrenceDate() != null && e.occurrenceDate().isAfter(baseDate)) {
                        start += 1440;
                        end += 1440;
                    }
                    return new Interval(
                            Math.max(start, windowStartMin),
                            Math.min(end, effectiveEnd)
                    );
                })
                .filter(Interval::isValid)
                .sorted(Comparator.comparingInt(Interval::start))
                .collect(Collectors.toList());

        if (intervals.isEmpty()) return UnionResult.empty();

        return mergeIntervals(intervals);
    }

    private UnionResult allDayBlockedResult(int windowStartMin, int windowEndMin, boolean crossesMidnight) {
        int total = crossesMidnight
                ? (1440 - windowStartMin + windowEndMin)
                : (windowEndMin - windowStartMin);
        return new UnionResult(Math.max(0, total), List.of(
                new AvailableTimeResponse.TimeInterval(minutesToHHMM(windowStartMin), minutesToHHMM(windowEndMin))
        ));
    }

    private UnionResult mergeIntervals(List<Interval> intervals) {
        List<AvailableTimeResponse.TimeInterval> blockedIntervals = new ArrayList<>();
        int totalBlocked = 0;
        Interval current = intervals.getFirst();

        for (int i = 1; i < intervals.size(); i++) {
            Interval next = intervals.get(i);
            if (next.overlaps(current)) {
                current = current.extendTo(next);
            } else {
                totalBlocked += current.duration();
                blockedIntervals.add(current.toTimeInterval());
                current = next;
            }
        }
        totalBlocked += current.duration();
        blockedIntervals.add(current.toTimeInterval());

        return new UnionResult(totalBlocked, blockedIntervals);
    }

    // ─── Utilities ────────────────────────────────────────────────────────────────

    private int toMinutes(LocalTime time) {
        return time.toSecondOfDay() / 60;
    }

    private String minutesToHHMM(int minutes) {
        return String.format("%02d:%02d", (minutes / 60) % 24, minutes % 60);
    }

    private String formatTime(LocalTime time) {
        return time != null ? time.toString().substring(0, 5) : null;
    }

    private AvailableTimeResponse zeroResponse(User user, boolean checkedIn, LocalTime checkinTime,
                                               boolean isPlanConfirmed, int streak) {
        return AvailableTimeResponse.builder()
                .availableMinutes(0).blockedMinutes(0)
                .bufferPct(user.getBufferPct()).workingWindowMinutes(0)
                .checkedIn(checkedIn).checkinTime(formatTime(checkinTime))
                .streak(streak)
                .isPlanConfirmed(isPlanConfirmed)
                .decayedTaskTitles(Collections.emptyList())
                .build();
    }

    // ─── Inner Types ──────────────────────────────────────────────────────────────

    private record Interval(int start, int end) {
        boolean isValid()           { return end > start; }
        boolean overlaps(Interval o){ return start <= o.end; }
        Interval extendTo(Interval o){ return new Interval(start, Math.max(end, o.end)); }
        int duration()              { return end - start; }

        AvailableTimeResponse.TimeInterval toTimeInterval() {
            return new AvailableTimeResponse.TimeInterval(
                    String.format("%02d:%02d", (start / 60) % 24, start % 60),
                    String.format("%02d:%02d", (end   / 60) % 24, end   % 60)
            );
        }
    }

    private record UnionResult(int totalBlockedMinutes, List<AvailableTimeResponse.TimeInterval> blockedIntervals) {
        static UnionResult empty() { return new UnionResult(0, Collections.emptyList()); }
    }
}
