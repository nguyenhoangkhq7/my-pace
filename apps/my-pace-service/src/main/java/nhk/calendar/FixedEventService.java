package nhk.calendar;

import lombok.RequiredArgsConstructor;
import nhk.user.User;
import nhk.user.UserRepository;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import nhk.task.Task;
import nhk.task.TaskRepository;
import nhk.planning.DailyPlan;
import nhk.planning.DailyPlanRepository;
import nhk.planning.DailyPlanTask;
import nhk.planning.DailyPlanTaskRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FixedEventService {

    private final FixedEventRepository eventRepo;
    private final FixedEventExceptionRepository exceptionRepo;
    private final UserRepository userRepo;
    private final DailyCheckinRepository checkinRepo;
    private final GoalRepository goalRepo;
    private final TaskRepository taskRepo;
    private final DailyPlanRepository dailyPlanRepo;
    private final DailyPlanTaskRepository dailyPlanTaskRepo;

    // ─── Read ────────────────────────────────────────────────────────────────

    /**
     * Returns all expanded occurrences in [start, end] for a user,
     * applying exceptions (overrides and soft-deletes).
     */
    @Transactional(readOnly = true)
    public List<FixedEventResponse> getEventsInRange(UUID userId, LocalDate start, LocalDate end) {
        List<FixedEvent> templates = eventRepo.findActiveInRange(userId, start, end);

        if (templates.isEmpty()) return Collections.emptyList();

        List<UUID> seriesIds = templates.stream().map(FixedEvent::getId).toList();
        List<FixedEventException> allExceptions =
                exceptionRepo.findByFixedEventIdInAndOccurrenceDateBetween(seriesIds, start, end);

        // Group exceptions by (seriesId, occurrenceDate) for O(1) lookup
        Map<String, FixedEventException> exceptionMap = allExceptions.stream()
                .collect(Collectors.toMap(
                        e -> e.getFixedEvent().getId() + "_" + e.getOccurrenceDate(),
                        e -> e
                ));

        List<FixedEventResponse> results = new ArrayList<>();

        for (FixedEvent fe : templates) {
            List<LocalDate> dates = expandDates(fe, start, end);
            List<Integer> daysOfWeek = parseDaysOfWeek(fe.getRecurrenceRule());

            for (LocalDate date : dates) {
                String key = fe.getId() + "_" + date;
                FixedEventException ex = exceptionMap.get(key);

                // Skip soft-deleted occurrences
                if (ex != null && Boolean.TRUE.equals(ex.getIsDeleted())) continue;

                results.add(buildResponse(fe, date, ex, daysOfWeek));
            }
        }

        return results;
    }

    /**
     * Available Time calculation for a specific date.
     * Formula: (sleepTime − max(wakeTime, now)) − union(fixedEvents on date) − buffer%
     */
    /**
     * Available Time calculation for a specific date.
     * Formula: (sleepTime − max(wakeTime, checkinTime, now)) − union(fixedEvents on date) − buffer%
     */
    @Transactional(readOnly = true)
    public AvailableTimeResponse getAvailableTime(UUID userId, LocalDate date) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        java.time.ZoneId zoneId = java.time.ZoneId.of(user.getTimezone());
        if (user.getWakeTime() == null || user.getSleepTime() == null) {
            return AvailableTimeResponse.builder()
                    .availableMinutes(0).blockedMinutes(0)
                    .bufferPct(user.getBufferPct()).workingWindowMinutes(0)
                    .checkedIn(false).checkinTime(null)
                    .streak(getStreakForUser(userId, zoneId))
                    .build();
        }

        // Query check-in for this user and date
        Optional<DailyCheckin> checkinOpt = checkinRepo.findByUserIdAndCheckinDate(userId, date);
        boolean checkedIn = checkinOpt.isPresent();
        LocalTime checkinTime = checkedIn ? checkinOpt.get().getCheckinTime() : null;

        LocalDate today = LocalDate.now(zoneId);
        LocalTime now = LocalTime.now(zoneId);

        // Check if sleepTime crosses midnight relative to wakeTime
        boolean isCrossMidnight = user.getSleepTime().isBefore(user.getWakeTime());

        // If planning today, check if now is outside the active window [wakeTime, sleepTime]
        if (date.equals(today)) {
            boolean isInside;
            if (!isCrossMidnight) {
                isInside = !now.isBefore(user.getWakeTime()) && !now.isAfter(user.getSleepTime());
            } else {
                isInside = !now.isBefore(user.getWakeTime()) || !now.isAfter(user.getSleepTime());
            }
            if (!isInside) {
                return AvailableTimeResponse.builder()
                        .availableMinutes(0).blockedMinutes(0)
                        .bufferPct(user.getBufferPct()).workingWindowMinutes(0)
                        .checkedIn(checkedIn)
                        .checkinTime(checkinTime != null ? checkinTime.toString().substring(0, 5) : null)
                        .streak(getStreakForUser(userId, zoneId))
                        .build();
            }
        }

        LocalTime windowStart;
        if (date.isBefore(today)) {
            windowStart = user.getSleepTime(); // past days have 0 available time
        } else if (date.equals(today)) {
            windowStart = now;
        } else {
            windowStart = user.getWakeTime();
        }
        LocalTime windowEnd = user.getSleepTime();

        int workingWindow = (int) java.time.Duration.between(windowStart, windowEnd).toMinutes();
        if (workingWindow < 0) {
            workingWindow += 1440;
        }

        if (workingWindow <= 0) {
            return AvailableTimeResponse.builder()
                    .availableMinutes(0).blockedMinutes(0)
                    .bufferPct(user.getBufferPct()).workingWindowMinutes(0)
                    .checkedIn(checkedIn)
                    .checkinTime(checkinTime != null ? checkinTime.toString().substring(0, 5) : null)
                    .streak(getStreakForUser(userId, zoneId))
                    .build();
        }

        // Get all events for this date
        List<FixedEventResponse> occurrences = getEventsForDate(userId, date);

        // Union-interval algorithm
        int blockedMinutes = computeUnionBlockedMinutes(occurrences, windowStart, windowEnd);

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
                .build();
    }

    @Transactional
    public AvailableTimeResponse checkin(UUID userId, LocalDate date, LocalTime checkinTime) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        DailyCheckin checkin = checkinRepo.findByUserIdAndCheckinDate(userId, date)
                .orElseGet(() -> DailyCheckin.builder()
                        .user(user)
                        .checkinDate(date)
                        .build());

        // Freeze checkinTime once recorded. Do not overwrite if already set.
        if (checkin.getCheckinTime() == null) {
            checkin.setCheckinTime(checkinTime != null ? checkinTime : LocalTime.now(java.time.ZoneId.of(user.getTimezone())));
            checkinRepo.save(checkin);

            // Auto-generate daily tasks for active goals
            generateDailyTasksForGoals(userId, date);
        }

        return getAvailableTime(userId, date);
    }

    private void generateDailyTasksForGoals(UUID userId, LocalDate date) {
        List<Goal> activeGoals = goalRepo.findByUserIdAndStatus(userId, "In Progress");
        if (activeGoals.isEmpty()) return;

        DailyPlan plan = null;

        for (Goal goal : activeGoals) {
            if (Boolean.TRUE.equals(goal.getAutoCreateTask())) {
                boolean isTimeBoxed = "Time-boxed".equals(goal.getGoalType()) && goal.getTimeBoxedGoal() != null;
                boolean isMilestone = "Milestone".equals(goal.getGoalType()) && goal.getMilestoneGoal() != null;
                
                if (!isTimeBoxed && !isMilestone) continue;

                if (taskRepo.existsByGoalIdAndDueDate(goal.getId(), date)) {
                    continue;
                }

                int estimatedMinutes = 0;

                if (isMilestone) {
                    estimatedMinutes = goal.getDefaultSessionMinutes() != null ? goal.getDefaultSessionMinutes() : 45;
                } else {
                    var tb = goal.getTimeBoxedGoal();
                    int targetMinutes = tb.getTargetMinutes() != null ? tb.getTargetMinutes() : 0;
                    int periodDays = tb.getPeriodDays() != null ? tb.getPeriodDays() : 1;

                    LocalDate startDate = goal.getStartDate() != null ? goal.getStartDate() : goal.getCreatedAt().toLocalDate();
                    long daysSinceStart = ChronoUnit.DAYS.between(startDate, date);
                    if (daysSinceStart < 0) {
                        continue;
                    }
                    long periodIndex = daysSinceStart / periodDays;
                    LocalDate periodStart = startDate.plusDays(periodIndex * periodDays);
                    LocalDate periodEnd = periodStart.plusDays(periodDays - 1);

                    int accumulated = taskRepo.sumActualMinutesByGoalIdAndDueDateBetween(goal.getId(), periodStart, periodEnd);
                    int remaining = targetMinutes - accumulated;

                    if (remaining <= 0) {
                        continue;
                    }

                    int defaultDaily = goal.getDefaultSessionMinutes() != null 
                            ? goal.getDefaultSessionMinutes() 
                            : (int) Math.ceil((double) targetMinutes / periodDays);
                    
                    long dayInPeriod = daysSinceStart % periodDays;
                    boolean isLastDayOfPeriod = (dayInPeriod == periodDays - 1);

                    if (isLastDayOfPeriod) {
                        estimatedMinutes = remaining;
                    } else {
                        estimatedMinutes = Math.min(remaining, defaultDaily);
                    }
                }

                if (estimatedMinutes <= 0) continue;

                Task task = new Task();
                task.setUserId(userId);
                task.setGoalId(goal.getId());
                task.setCategoryId(goal.getCategoryId());
                task.setTitle(goal.getTitle());
                task.setEstimatedMinutes(estimatedMinutes);
                task.setActualMinutes(0);
                task.setIsImportant(true);
                task.setIsUrgent(false);
                task.setStatus("Picked for Today");
                task.setDueDate(date);
                task.setTaskType("GOAL_SESSION");

                task = taskRepo.save(task);

                if (plan == null) {
                    plan = dailyPlanRepo.findByUserIdAndPlanDate(userId, date)
                            .orElseGet(() -> {
                                DailyPlan newPlan = new DailyPlan();
                                newPlan.setUserId(userId);
                                newPlan.setPlanDate(date);
                                newPlan.setAvailableMinutes(0);
                                newPlan.setIsConfirmed(false);
                                return dailyPlanRepo.save(newPlan);
                            });
                }

                final UUID savedTaskId = task.getId();
                boolean linkExists = dailyPlanTaskRepo.findByDailyPlanIdOrderBySortOrderAsc(plan.getId())
                        .stream().anyMatch(pt -> pt.getTask().getId().equals(savedTaskId));
                
                if (!linkExists) {
                    DailyPlanTask planTask = new DailyPlanTask();
                    planTask.setDailyPlanId(plan.getId());
                    planTask.setTask(task);
                    planTask.setIsMit(task.getIsImportant());
                    planTask.setSortOrder(0);
                    dailyPlanTaskRepo.save(planTask);
                }
            }
        }
    }

    // ─── Write ───────────────────────────────────────────────────────────────

    @Transactional
    public FixedEventResponse createEvent(UUID userId, FixedEventRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        validateRequest(request);

        FixedEvent fe = FixedEvent.builder()
                .user(user)
                .title(request.getTitle())
                .notes(request.getNotes())
                .eventDate(request.getEventDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .recurrenceType(request.getRecurrenceType())
                .recurrenceRule(buildRecurrenceRule(request))
                .recurrenceEndDate(request.getRecurrenceEndDate())
                .build();

        eventRepo.save(fe);

        LocalDate occurrenceDate = request.getEventDate() != null
                ? request.getEventDate() : LocalDate.now();
        return buildResponse(fe, occurrenceDate, null, parseDaysOfWeek(fe.getRecurrenceRule()));
    }

    @Transactional
    public FixedEventResponse updateAllOccurrences(UUID userId, UUID eventId, FixedEventRequest request) {
        FixedEvent fe = requireOwnedEvent(userId, eventId);

        validateRequest(request);

        fe.setTitle(request.getTitle());
        fe.setNotes(request.getNotes());
        fe.setEventDate(request.getEventDate());
        fe.setStartTime(request.getStartTime());
        fe.setEndTime(request.getEndTime());
        fe.setRecurrenceType(request.getRecurrenceType());
        fe.setRecurrenceRule(buildRecurrenceRule(request));
        fe.setRecurrenceEndDate(request.getRecurrenceEndDate());

        // All exceptions become stale — remove them
        exceptionRepo.deleteAllByFixedEventId(eventId);

        eventRepo.save(fe);

        LocalDate occurrenceDate = request.getEventDate() != null
                ? request.getEventDate() : LocalDate.now();
        return buildResponse(fe, occurrenceDate, null, parseDaysOfWeek(fe.getRecurrenceRule()));
    }

    @Transactional
    public FixedEventResponse updateSingleOccurrence(UUID userId, UUID eventId,
                                                     LocalDate occurrenceDate,
                                                     FixedEventExceptionRequest request) {
        FixedEvent fe = requireOwnedEvent(userId, eventId);

        FixedEventException ex = exceptionRepo
                .findByFixedEventIdAndOccurrenceDate(eventId, occurrenceDate)
                .orElseGet(() -> {
                    FixedEventException newEx = new FixedEventException();
                    newEx.setFixedEvent(fe);
                    newEx.setOccurrenceDate(occurrenceDate);
                    newEx.setIsDeleted(false);
                    return newEx;
                });

        if (request.getOverrideTitle() != null) ex.setOverrideTitle(request.getOverrideTitle());
        if (request.getOverrideNotes() != null) ex.setOverrideNotes(request.getOverrideNotes());
        if (request.getOverrideStartTime() != null) ex.setOverrideStartTime(request.getOverrideStartTime());
        if (request.getOverrideEndTime() != null) ex.setOverrideEndTime(request.getOverrideEndTime());
        if (request.getIsDeleted() != null) ex.setIsDeleted(request.getIsDeleted());

        exceptionRepo.save(ex);
        return buildResponse(fe, occurrenceDate, ex, parseDaysOfWeek(fe.getRecurrenceRule()));
    }

    @Transactional
    public void deleteAllOccurrences(UUID userId, UUID eventId) {
        FixedEvent fe = requireOwnedEvent(userId, eventId);
        eventRepo.delete(fe);
    }

    @Transactional
    public void deleteSingleOccurrence(UUID userId, UUID eventId, LocalDate occurrenceDate) {
        FixedEvent fe = requireOwnedEvent(userId, eventId);

        FixedEventException ex = exceptionRepo
                .findByFixedEventIdAndOccurrenceDate(eventId, occurrenceDate)
                .orElseGet(() -> {
                    FixedEventException newEx = new FixedEventException();
                    newEx.setFixedEvent(fe);
                    newEx.setOccurrenceDate(occurrenceDate);
                    return newEx;
                });
        ex.setIsDeleted(true);
        exceptionRepo.save(ex);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private List<FixedEventResponse> getEventsForDate(UUID userId, LocalDate date) {
        return getEventsInRange(userId, date, date);
    }

    private FixedEvent requireOwnedEvent(UUID userId, UUID eventId) {
        FixedEvent fe = eventRepo.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        if (!fe.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return fe;
    }

    /**
     * Union-Interval Algorithm:
     * Merges overlapping intervals and returns the total blocked minutes
     * that fall within the working window.
     */
    private int computeUnionBlockedMinutes(List<FixedEventResponse> occurrences,
                                           LocalTime windowStart, LocalTime windowEnd) {
        if (occurrences.isEmpty()) return 0;

        int windowStartMin = (int) (windowStart.toSecondOfDay() / 60);
        int windowEndMin   = (int) (windowEnd.toSecondOfDay() / 60);

        boolean crossesMidnight = windowEnd.isBefore(windowStart);

        List<int[]> intervals;
        if (!crossesMidnight) {
            intervals = occurrences.stream()
                    .map(e -> new int[]{
                            Math.max((int) (e.getStartTime().toSecondOfDay() / 60), windowStartMin),
                            Math.min((int) (e.getEndTime().toSecondOfDay() / 60),   windowEndMin)
                    })
                    .filter(iv -> iv[1] > iv[0])   // discard events entirely outside window
                    .sorted(Comparator.comparingInt(iv -> iv[0]))
                    .collect(Collectors.toList());
        } else {
            int endOfTodayMin = 24 * 60; // 1440 minutes
            intervals = occurrences.stream()
                    .map(e -> new int[]{
                            Math.max((int) (e.getStartTime().toSecondOfDay() / 60), windowStartMin),
                            Math.min((int) (e.getEndTime().toSecondOfDay() / 60),   endOfTodayMin)
                    })
                    .filter(iv -> iv[1] > iv[0])   // discard events entirely outside window
                    .sorted(Comparator.comparingInt(iv -> iv[0]))
                    .collect(Collectors.toList());
        }

        if (intervals.isEmpty()) return 0;

        int totalBlocked = 0;
        int[] current = intervals.get(0);

        for (int i = 1; i < intervals.size(); i++) {
            int[] next = intervals.get(i);
            if (next[0] <= current[1]) {
                // Overlapping — extend current interval
                current[1] = Math.max(current[1], next[1]);
            } else {
                totalBlocked += current[1] - current[0];
                current = next;
            }
        }
        totalBlocked += current[1] - current[0];

        return totalBlocked;
    }

    /**
     * Expands a FixedEvent template into concrete dates within [start, end].
     */
    private List<LocalDate> expandDates(FixedEvent fe, LocalDate start, LocalDate end) {
        String type = fe.getRecurrenceType();

        if ("NONE".equals(type)) {
            LocalDate d = fe.getEventDate();
            if (d != null && !d.isBefore(start) && !d.isAfter(end)) {
                return List.of(d);
            }
            return Collections.emptyList();
        }

        // Recurring: iterate day-by-day from max(seriesStart, rangeStart) to min(seriesEnd, rangeEnd)
        LocalDate seriesStart = fe.getEventDate() != null ? fe.getEventDate() : start;
        LocalDate seriesEnd   = fe.getRecurrenceEndDate() != null ? fe.getRecurrenceEndDate() : end;

        LocalDate from = seriesStart.isBefore(start) ? start : seriesStart;
        LocalDate to   = seriesEnd.isAfter(end)       ? end   : seriesEnd;

        if (from.isAfter(to)) return Collections.emptyList();

        Set<Integer> allowedDays = new HashSet<>(parseDaysOfWeek(fe.getRecurrenceRule()));
        List<LocalDate> result   = new ArrayList<>();

        LocalDate cursor = from;
        while (!cursor.isAfter(to)) {
            boolean include = switch (type) {
                case "DAILY" -> true;
                case "WEEKLY", "CUSTOM" -> allowedDays.contains(cursor.getDayOfWeek().getValue());
                default -> false;
            };
            if (include) result.add(cursor);
            cursor = cursor.plusDays(1);
        }
        return result;
    }

    /** Parses "1,3,5" → [1, 3, 5]. Returns empty list for null/blank. */
    private List<Integer> parseDaysOfWeek(String rule) {
        if (rule == null || rule.isBlank()) return Collections.emptyList();
        return Arrays.stream(rule.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .collect(Collectors.toList());
    }

    /** Converts List<Integer> day-of-week to comma-separated string. */
    private String buildRecurrenceRule(FixedEventRequest request) {
        List<Integer> days = request.getRecurrenceDaysOfWeek();
        if (days == null || days.isEmpty()) return null;
        return days.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    private void validateRequest(FixedEventRequest request) {
        if (request.getEndTime().isBefore(request.getStartTime()) ||
            request.getEndTime().equals(request.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endTime must be after startTime");
        }
        if ("NONE".equals(request.getRecurrenceType()) && request.getEventDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "eventDate is required for non-recurring events");
        }
    }

    private FixedEventResponse buildResponse(FixedEvent fe, LocalDate occurrenceDate,
                                             FixedEventException ex,
                                             List<Integer> daysOfWeek) {
        // Apply exception overrides if present
        String title     = (ex != null && ex.getOverrideTitle()     != null) ? ex.getOverrideTitle()     : fe.getTitle();
        String notes     = (ex != null && ex.getOverrideNotes()     != null) ? ex.getOverrideNotes()     : fe.getNotes();
        LocalTime start  = (ex != null && ex.getOverrideStartTime() != null) ? ex.getOverrideStartTime() : fe.getStartTime();
        LocalTime end    = (ex != null && ex.getOverrideEndTime()   != null) ? ex.getOverrideEndTime()   : fe.getEndTime();

        return FixedEventResponse.builder()
                .id(fe.getId() + "_" + occurrenceDate)
                .seriesId(fe.getId())
                .title(title)
                .notes(notes)
                .occurrenceDate(occurrenceDate)
                .startTime(start)
                .endTime(end)
                .recurrenceType(fe.getRecurrenceType())
                .recurrenceDaysOfWeek(daysOfWeek)
                .recurrenceEndDate(fe.getRecurrenceEndDate())
                .isException(ex != null)
                .build();
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
}
