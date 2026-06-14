package nhk.task.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nhk.auth.SecurityUtils;
import nhk.task.dto.request.EventRequest;
import nhk.task.dto.response.CalendarEventResponse;
import nhk.task.entity.Event;
import nhk.task.entity.RecurrenceEvent;
import nhk.task.repository.EventRepository;
import nhk.task.repository.RecurrenceEventRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {
    private static final List<String> COLOR_PALETTE = List.of(
            "#60a5fa", "#34d399", "#f59e0b", "#f472b6", "#a78bfa", "#f87171"
    );

    private final EventRepository eventRepository;
    private final RecurrenceEventRepository recurrenceEventRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> getEvents() {
        User currentUser = getCurrentUser();
        List<CalendarEventResponse> items = new ArrayList<>();

        for (Event event : eventRepository.findAllByUser_IdOrderByStartAtAsc(currentUser.getId())) {
            items.add(toResponse(event.getId(), event.getTitle(), event.getStartAt(), event.getEndAt(), event.getId()));
        }

        for (RecurrenceEvent recurrenceEvent : recurrenceEventRepository.findAllByUser_IdAndIsCancelledFalseOrderByStartAtAsc(currentUser.getId())) {
            Event event = recurrenceEvent.getEvent();
            items.add(toResponse(
                    recurrenceEvent.getId(),
                    event.getTitle(),
                    recurrenceEvent.getStartAt(),
                    recurrenceEvent.getEndAt(),
                    event.getId()
            ));
        }

        items.sort(Comparator.comparing(CalendarEventResponse::startAt));
        return items;
    }

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> getUpcomingEvents() {
        User currentUser = getCurrentUser();
        LocalDateTime now = LocalDateTime.now();

        List<CalendarEventResponse> items = new ArrayList<>();

        for (Event event : eventRepository.findAllByUser_IdAndStartAtGreaterThanEqualOrderByStartAtAsc(currentUser.getId(), now)) {
            items.add(toResponse(event.getId(), event.getTitle(), event.getStartAt(), event.getEndAt(), event.getId()));
        }

        for (RecurrenceEvent recurrenceEvent : recurrenceEventRepository.findAllByUser_IdAndIsCancelledFalseAndStartAtGreaterThanEqualOrderByStartAtAsc(currentUser.getId(), now)) {
            Event event = recurrenceEvent.getEvent();
            items.add(toResponse(
                    recurrenceEvent.getId(),
                    event.getTitle(),
                    recurrenceEvent.getStartAt(),
                    recurrenceEvent.getEndAt(),
                    event.getId()
            ));
        }

        items.sort(Comparator.comparing(CalendarEventResponse::startAt));
        return items;
    }

    @Transactional(readOnly = true)
    public CalendarEventResponse getEvent(Integer id) {
        User currentUser = getCurrentUser();
        Event event = eventRepository.findByIdAndUser_Id(id, currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("Event not found with id: " + id));
        return toResponse(event);
    }

    @Transactional
    public CalendarEventResponse createEvent(EventRequest request) {
        validateEventWindow(request.startAt(), request.endAt());

        User currentUser = getCurrentUser();
        Event event = new Event();
        event.setUser(userRepository.getReferenceById(currentUser.getId()));
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setStartAt(request.startAt());
        event.setEndAt(request.endAt());
        event.setIsRecurring(request.isRecurring() != null && request.isRecurring());
        event.setRecurrenceRule(request.recurrenceRule());
        event.setCreatedAt(LocalDateTime.now());

        return toResponse(eventRepository.save(event));
    }

    @Transactional
    public CalendarEventResponse updateEvent(Integer id, EventRequest request) {
        validateEventWindow(request.startAt(), request.endAt());

        User currentUser = getCurrentUser();
        Event event = eventRepository.findByIdAndUser_Id(id, currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("Event not found with id: " + id));

        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setStartAt(request.startAt());
        event.setEndAt(request.endAt());
        event.setIsRecurring(request.isRecurring() != null && request.isRecurring());
        event.setRecurrenceRule(request.recurrenceRule());

        return toResponse(eventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(Integer id) {
        User currentUser = getCurrentUser();
        Event event = eventRepository.findByIdAndUser_Id(id, currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("Event not found with id: " + id));
        eventRepository.delete(event);
    }

    private void validateEventWindow(LocalDateTime startAt, LocalDateTime endAt) {
        if (endAt.isBefore(startAt) || endAt.isEqual(startAt)) {
            throw new IllegalArgumentException("endAt must be after startAt");
        }
    }

    private CalendarEventResponse toResponse(Event event) {
        return toResponse(event.getId(), event.getTitle(), event.getStartAt(), event.getEndAt(), event.getId());
    }

    private CalendarEventResponse toResponse(Integer id, String title, LocalDateTime startAt, LocalDateTime endAt, Integer seed) {
        return new CalendarEventResponse(id, title, startAt, endAt, pickColor(seed));
    }

    private String pickColor(Integer seed) {
        if (seed == null) {
            return COLOR_PALETTE.getFirst();
        }
        return COLOR_PALETTE.get(Math.floorMod(seed, COLOR_PALETTE.size()));
    }

    private User getCurrentUser() {
        return SecurityUtils.getCurrentUser()
                .orElseThrow(() -> new AccessDeniedException("Unable to resolve current user"));
    }
}

