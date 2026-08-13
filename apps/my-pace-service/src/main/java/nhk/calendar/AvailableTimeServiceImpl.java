package nhk.calendar;

import lombok.RequiredArgsConstructor;
import nhk.common.UserNotFoundException;
import nhk.user.User;
import nhk.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
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

        LocalDateTime nowDateTime = resolveNowDateTime(zoneId, date, userId);

        boolean isPlanConfirmed = isPlanConfirmed(date, userId, zoneId);

        LocalDateTime logicalStart = date.atTime(user.getWakeTime());
        LocalDateTime logicalEnd = date.atTime(user.getSleepTime());
        if (user.getSleepTime().equals(LocalTime.MIDNIGHT)) {
            logicalEnd = date.plusDays(1).atStartOfDay();
        } else if (user.getSleepTime().isBefore(user.getWakeTime())) {
            logicalEnd = logicalEnd.plusDays(1);
        }

        if (!nowDateTime.isBefore(logicalEnd)) { // now >= logicalEnd
            return zeroResponse(user, checkedIn, checkinTime, isPlanConfirmed, streak);
        }

        LocalDateTime windowStart = nowDateTime.isBefore(logicalStart) ? logicalStart : nowDateTime;
        int workingWindow = (int) Duration.between(windowStart, logicalEnd).toMinutes();

        if (workingWindow <= 0) {
            return zeroResponse(user, checkedIn, checkinTime, isPlanConfirmed, streak);
        }

        List<FixedEventResponse> occurrencesToday = eventService.getEventsInRange(userId, date, date);
        List<FixedEventResponse> occurrencesTomorrow = eventService.getEventsInRange(userId, date.plusDays(1), date.plusDays(1));
        
        List<FixedEventResponse> allOccurrences = new ArrayList<>(occurrencesToday);
        allOccurrences.addAll(occurrencesTomorrow);

        UnionResult unionResult = computeUnionBlockedMinutes(allOccurrences, windowStart, logicalEnd, date);

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
    private LocalDateTime resolveNowDateTime(ZoneId zoneId, LocalDate date, UUID userId) {
        return dailyPlanRepository.findByUserIdAndPlanDate(userId, date)
                .filter(p -> Boolean.TRUE.equals(p.getIsConfirmed()) && p.getConfirmedAt() != null)
                .map(p -> p.getConfirmedAt().atZoneSameInstant(zoneId).toLocalDateTime())
                .orElseGet(() -> LocalDateTime.now(zoneId));
    }

    private boolean isPlanConfirmed(LocalDate date, UUID userId, ZoneId zoneId) {
        return dailyPlanRepository.findByUserIdAndPlanDate(userId, date)
                .map(p -> Boolean.TRUE.equals(p.getIsConfirmed()))
                .orElse(false);
    }

    // ─── Union-Interval Algorithm ─────────────────────────────────────────────────

    private UnionResult computeUnionBlockedMinutes(List<FixedEventResponse> occurrences,
                                                   LocalDateTime windowStart, LocalDateTime windowEnd, LocalDate baseDate) {
        List<FixedEventResponse> busyEvents = occurrences.stream()
                .filter(e -> !"FREE".equalsIgnoreCase(e.availabilityStatus()))
                .toList();

        if (busyEvents.isEmpty()) return UnionResult.empty();

        LocalDateTime baseStart = baseDate.atStartOfDay();
        int windowStartMin = (int) Duration.between(baseStart, windowStart).toMinutes();
        int windowEndMin = (int) Duration.between(baseStart, windowEnd).toMinutes();

        if (busyEvents.stream().anyMatch(e -> Boolean.TRUE.equals(e.isAllDay()))) {
            int total = windowEndMin - windowStartMin;
            return new UnionResult(Math.max(0, total), List.of(
                    new AvailableTimeResponse.TimeInterval(minutesToHHMM(windowStartMin), minutesToHHMM(windowEndMin))
            ));
        }

        List<Interval> intervals = busyEvents.stream()
                .map(e -> {
                    LocalDate occDate = e.occurrenceDate() != null ? e.occurrenceDate() : baseDate;
                    LocalDateTime evStart = occDate.atTime(e.startTime());
                    LocalDateTime evEnd = occDate.atTime(e.endTime());
                    if (!evEnd.isAfter(evStart) && !"00:00".equals(e.endTime().toString())) {
                        evEnd = evEnd.plusDays(1);
                    }
                    
                    int startMin = (int) Duration.between(baseStart, evStart).toMinutes();
                    int endMin = (int) Duration.between(baseStart, evEnd).toMinutes();
                    
                    return new Interval(
                            Math.max(startMin, windowStartMin),
                            Math.min(endMin, windowEndMin)
                    );
                })
                .filter(Interval::isValid)
                .sorted(Comparator.comparingInt(Interval::start))
                .collect(Collectors.toList());

        if (intervals.isEmpty()) return UnionResult.empty();

        return mergeIntervals(intervals);
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
