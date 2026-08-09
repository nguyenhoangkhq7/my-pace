package nhk.calendar;

import lombok.RequiredArgsConstructor;
import nhk.common.UserNotFoundException;
import nhk.user.User;
import nhk.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
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

    @Override
    @Transactional(readOnly = true)
    public AvailableTimeResponse getAvailableTime(UUID userId, LocalDate date) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        java.time.ZoneId zoneId = java.time.ZoneId.of(
                user.getTimezone() != null && !user.getTimezone().isBlank() ? user.getTimezone() : "UTC"
        );

        if (user.getWakeTime() == null || user.getSleepTime() == null) {
            return AvailableTimeResponse.builder()
                    .availableMinutes(0).blockedMinutes(0)
                    .bufferPct(user.getBufferPct()).workingWindowMinutes(0)
                    .checkedIn(false).checkinTime(null)
                    .streak(getStreakForUser(userId, zoneId))
                    .isPlanConfirmed(false)
                    .decayedTaskTitles(java.util.Collections.emptyList())
                    .build();
        }

        // Query check-in for this user and date
        Optional<DailyCheckin> checkinOpt = checkinRepo.findByUserIdAndCheckinDate(userId, date);
        boolean checkedIn = checkinOpt.isPresent();
        LocalTime checkinTime = checkedIn ? checkinOpt.get().getCheckinTime() : null;

        LocalDate today = LocalDate.now(zoneId);
        LocalTime now = LocalTime.now(zoneId);

        Optional<DailyPlan> planOpt = dailyPlanRepository.findByUserIdAndPlanDate(userId, date);
        boolean isPlanConfirmed = planOpt.isPresent() && planOpt.get().getIsConfirmed();
        if (isPlanConfirmed && planOpt.get().getConfirmedAt() != null) {
            now = planOpt.get().getConfirmedAt().atZoneSameInstant(zoneId).toLocalTime();
        }

        // Check if sleepTime crosses midnight relative to wakeTime
        boolean isCrossMidnight = !user.getSleepTime().equals(LocalTime.MIDNIGHT) && user.getSleepTime().isBefore(user.getWakeTime());

        // Determine windowStart based on today vs past vs future
        LocalTime windowStart;
        if (date.isBefore(today)) {
            windowStart = user.getSleepTime(); // past days have 0 available time
        } else if (date.equals(today)) {
            // Check if day is already over today
            boolean isOver;
            if (user.getSleepTime().equals(LocalTime.MIDNIGHT)) {
                isOver = false;
            } else if (!isCrossMidnight) {
                isOver = now.isAfter(user.getSleepTime());
            } else {
                isOver = now.isAfter(user.getSleepTime()) && now.isBefore(user.getWakeTime());
            }
            if (isOver) {
                return AvailableTimeResponse.builder()
                        .availableMinutes(0).blockedMinutes(0)
                        .bufferPct(user.getBufferPct()).workingWindowMinutes(0)
                        .checkedIn(checkedIn)
                        .checkinTime(checkinTime != null ? checkinTime.toString().substring(0, 5) : null)
                        .streak(getStreakForUser(userId, zoneId))
                        .isPlanConfirmed(isPlanConfirmed)
                        .decayedTaskTitles(java.util.Collections.emptyList())
                        .build();
            }
            
            // Apply 15-minute buffer starting from wakeTime (if before wakeTime) or now (if inside)
            if (now.isBefore(user.getWakeTime())) {
                windowStart = user.getWakeTime().plusMinutes(15);
            } else {
                windowStart = now.plusMinutes(15);
            }
        } else {
            // Tomorrow / Future starts from Giờ thức dậy + 15m
            windowStart = user.getWakeTime().plusMinutes(15);
        }
        LocalTime windowEnd = user.getSleepTime();

        int workingWindow;
        if (windowEnd.equals(LocalTime.MIDNIGHT)) {
            workingWindow = 1440 - (windowStart.toSecondOfDay() / 60);
        } else {
            workingWindow = (int) java.time.Duration.between(windowStart, windowEnd).toMinutes();
            if (workingWindow < 0) {
                if (isCrossMidnight) {
                    workingWindow += 1440;
                } else {
                    workingWindow = 0;
                }
            }
        }

        if (workingWindow <= 0) {
            return AvailableTimeResponse.builder()
                    .availableMinutes(0).blockedMinutes(0)
                    .bufferPct(user.getBufferPct()).workingWindowMinutes(0)
                    .checkedIn(checkedIn)
                    .checkinTime(checkinTime != null ? checkinTime.toString().substring(0, 5) : null)
                    .streak(getStreakForUser(userId, zoneId))
                    .isPlanConfirmed(isPlanConfirmed)
                    .decayedTaskTitles(java.util.Collections.emptyList())
                    .build();
        }

        // Get all events for this date using FixedEventService
        List<FixedEventResponse> occurrences = eventService.getEventsInRange(userId, date, date);

        // Union-interval algorithm
        UnionResult unionResult = computeUnionBlockedMinutes(occurrences, windowStart, windowEnd);
        int blockedMinutes = unionResult.totalBlockedMinutes;

        int remainingMinutes = workingWindow - blockedMinutes;
        int bufferPct = user.getBufferPct();
        int availableMinutes = (int) (remainingMinutes * (1.0 - bufferPct / 100.0));
        availableMinutes = Math.max(0, availableMinutes);

        return AvailableTimeResponse.builder()
                .availableMinutes(availableMinutes)
                .blockedMinutes(blockedMinutes)
                .bufferPct(bufferPct)
                .workingWindowMinutes(workingWindow)
                .checkedIn(checkedIn)
                .checkinTime(checkinTime != null ? checkinTime.toString().substring(0, 5) : null)
                .streak(getStreakForUser(userId, zoneId))
                .blockedIntervals(unionResult.blockedIntervals)
                .isPlanConfirmed(isPlanConfirmed)
                .decayedTaskTitles(java.util.Collections.emptyList())
                .build();
    }

    private UnionResult computeUnionBlockedMinutes(List<FixedEventResponse> occurrences,
                                                   LocalTime windowStart, LocalTime windowEnd) {
        List<FixedEventResponse> busyOccurrences = occurrences.stream()
                .filter(e -> !"FREE".equalsIgnoreCase(e.availabilityStatus()))
                .toList();

        if (busyOccurrences.isEmpty()) {
            return new UnionResult(0, java.util.Collections.emptyList());
        }

        int windowStartMin = windowStart.toSecondOfDay() / 60;
        int windowEndMin   = windowEnd.toSecondOfDay() / 60;

        boolean crossesMidnight = windowEnd.isBefore(windowStart);

        boolean hasAllDay = busyOccurrences.stream().anyMatch(e -> Boolean.TRUE.equals(e.isAllDay()));
        if (hasAllDay) {
            int totalWindow = !crossesMidnight
                    ? (windowEndMin - windowStartMin)
                    : (1440 - windowStartMin + windowEndMin);
            totalWindow = Math.max(0, totalWindow);
            return new UnionResult(totalWindow, List.of(
                    new AvailableTimeResponse.TimeInterval(minutesToHHMM(windowStartMin), minutesToHHMM(windowEndMin))
            ));
        }

        List<int[]> intervals;
        if (!crossesMidnight) {
            intervals = busyOccurrences.stream()
                    .map(e -> new int[]{
                            Math.max(e.startTime().toSecondOfDay() / 60, windowStartMin),
                            Math.min(e.endTime().toSecondOfDay() / 60,   windowEndMin)
                    })
                    .filter(iv -> iv[1] > iv[0])   // discard events entirely outside window
                    .sorted(Comparator.comparingInt(iv -> iv[0]))
                    .collect(Collectors.toList());
        } else {
            int endOfTodayMin = 24 * 60; // 1440 minutes
            intervals = busyOccurrences.stream()
                    .map(e -> new int[]{
                            Math.max(e.startTime().toSecondOfDay() / 60, windowStartMin),
                            Math.min(e.endTime().toSecondOfDay() / 60,   endOfTodayMin)
                    })
                    .filter(iv -> iv[1] > iv[0])   // discard events entirely outside window
                    .sorted(Comparator.comparingInt(iv -> iv[0]))
                    .collect(Collectors.toList());
        }

        if (intervals.isEmpty()) {
            return new UnionResult(0, java.util.Collections.emptyList());
        }

        List<AvailableTimeResponse.TimeInterval> blockedIntervals = new java.util.ArrayList<>();
        int totalBlocked = 0;
        int[] current = intervals.get(0);

        for (int i = 1; i < intervals.size(); i++) {
            int[] next = intervals.get(i);
            if (next[0] <= current[1]) {
                // Overlapping — extend current interval
                current[1] = Math.max(current[1], next[1]);
            } else {
                totalBlocked += current[1] - current[0];
                blockedIntervals.add(new AvailableTimeResponse.TimeInterval(minutesToHHMM(current[0]), minutesToHHMM(current[1])));
                current = next;
            }
        }
        totalBlocked += current[1] - current[0];
        blockedIntervals.add(new AvailableTimeResponse.TimeInterval(minutesToHHMM(current[0]), minutesToHHMM(current[1])));

        return new UnionResult(totalBlocked, blockedIntervals);
    }

    private String minutesToHHMM(int minutes) {
        int h = (minutes / 60) % 24;
        int m = minutes % 60;
        return String.format("%02d:%02d", h, m);
    }

    private int getStreakForUser(UUID userId, java.time.ZoneId zoneId) {
        LocalDate today = LocalDate.now(zoneId);
        List<DailyCheckin> checkins = checkinRepo.findByUserIdOrderByCheckinDateDesc(userId);
        if (checkins.isEmpty()) {
            return 0;
        }

        int streak = 0;
        LocalDate current = today;
        boolean foundToday = false;
        boolean foundYesterday = false;

        for (DailyCheckin dc : checkins) {
            LocalDate d = dc.getCheckinDate();
            if (d.equals(today)) {
                foundToday = true;
            } else if (d.equals(today.minusDays(1))) {
                foundYesterday = true;
            }
        }

        if (foundToday) {
            current = today;
        } else if (foundYesterday) {
            current = today.minusDays(1);
        } else {
            return 0;
        }

        for (DailyCheckin dc : checkins) {
            LocalDate d = dc.getCheckinDate();
            if (d.equals(current)) {
                streak++;
                current = current.minusDays(1);
            } else if (d.isBefore(current)) {
                break;
            }
        }

        return streak;
    }

    private record UnionResult(int totalBlockedMinutes, List<AvailableTimeResponse.TimeInterval> blockedIntervals) {
    }
}
