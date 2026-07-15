package nhk.calendar;

import lombok.RequiredArgsConstructor;
import nhk.common.EventNotFoundException;
import nhk.common.UserNotFoundException;
import nhk.user.User;
import nhk.user.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FixedEventServiceImpl implements FixedEventService {

    private final FixedEventRepository eventRepo;
    private final FixedEventExceptionRepository exceptionRepo;
    private final UserRepository userRepo;

    @Override
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

    @Override
    @Transactional
    public FixedEventResponse createEvent(UUID userId, FixedEventRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        validateRequest(request);

        FixedEvent fe = FixedEvent.builder()
                .user(user)
                .title(request.title())
                .notes(request.notes())
                .eventDate(request.eventDate())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .recurrenceType(request.recurrenceType())
                .recurrenceRule(buildRecurrenceRule(request))
                .recurrenceEndDate(request.recurrenceEndDate())
                .build();

        eventRepo.save(fe);

        LocalDate occurrenceDate = request.eventDate() != null
                ? request.eventDate() : LocalDate.now();
        return buildResponse(fe, occurrenceDate, null, parseDaysOfWeek(fe.getRecurrenceRule()));
    }

    @Override
    @Transactional
    public FixedEventResponse updateAllOccurrences(UUID userId, UUID eventId, FixedEventRequest request) {
        FixedEvent fe = requireOwnedEvent(userId, eventId);

        validateRequest(request);

        fe.setTitle(request.title());
        fe.setNotes(request.notes());
        fe.setEventDate(request.eventDate());
        fe.setStartTime(request.startTime());
        fe.setEndTime(request.endTime());
        fe.setRecurrenceType(request.recurrenceType());
        fe.setRecurrenceRule(buildRecurrenceRule(request));
        fe.setRecurrenceEndDate(request.recurrenceEndDate());

        // All exceptions become stale — remove them
        exceptionRepo.deleteAllByFixedEventId(eventId);

        eventRepo.save(fe);

        LocalDate occurrenceDate = request.eventDate() != null
                ? request.eventDate() : LocalDate.now();
        return buildResponse(fe, occurrenceDate, null, parseDaysOfWeek(fe.getRecurrenceRule()));
    }

    @Override
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

        if (request.overrideTitle() != null) ex.setOverrideTitle(request.overrideTitle());
        if (request.overrideNotes() != null) ex.setOverrideNotes(request.overrideNotes());
        if (request.overrideStartTime() != null) ex.setOverrideStartTime(request.overrideStartTime());
        if (request.overrideEndTime() != null) ex.setOverrideEndTime(request.overrideEndTime());
        if (request.isDeleted() != null) ex.setIsDeleted(request.isDeleted());

        exceptionRepo.save(ex);
        return buildResponse(fe, occurrenceDate, ex, parseDaysOfWeek(fe.getRecurrenceRule()));
    }

    @Override
    @Transactional
    public void deleteAllOccurrences(UUID userId, UUID eventId) {
        FixedEvent fe = requireOwnedEvent(userId, eventId);
        eventRepo.delete(fe);
    }

    @Override
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

    private FixedEvent requireOwnedEvent(UUID userId, UUID eventId) {
        FixedEvent fe = eventRepo.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with ID: " + eventId));
        if (!fe.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Access denied");
        }
        return fe;
    }

    private List<LocalDate> expandDates(FixedEvent fe, LocalDate start, LocalDate end) {
        String type = fe.getRecurrenceType();

        if ("NONE".equals(type)) {
            LocalDate d = fe.getEventDate();
            if (d != null && !d.isBefore(start) && !d.isAfter(end)) {
                return List.of(d);
            }
            return Collections.emptyList();
        }

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

    private List<Integer> parseDaysOfWeek(String rule) {
        if (rule == null || rule.isBlank()) return Collections.emptyList();
        return Arrays.stream(rule.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .collect(Collectors.toList());
    }

    private String buildRecurrenceRule(FixedEventRequest request) {
        List<Integer> days = request.recurrenceDaysOfWeek();
        if (days == null || days.isEmpty()) return null;
        return days.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    private void validateRequest(FixedEventRequest request) {
        if (request.endTime().isBefore(request.startTime()) ||
            request.endTime().equals(request.startTime())) {
            throw new IllegalArgumentException("endTime must be after startTime");
        }
        if ("NONE".equals(request.recurrenceType()) && request.eventDate() == null) {
            throw new IllegalArgumentException("eventDate is required for non-recurring events");
        }
    }

    private FixedEventResponse buildResponse(FixedEvent fe, LocalDate occurrenceDate,
                                             FixedEventException ex,
                                             List<Integer> daysOfWeek) {
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
}
