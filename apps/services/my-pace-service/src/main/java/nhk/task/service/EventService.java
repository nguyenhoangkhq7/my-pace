package nhk.task.service;

import lombok.RequiredArgsConstructor;
import nhk.auth.SecurityUtils;
import nhk.task.dto.response.CalendarEventResponse;
import nhk.task.entity.Event;
import nhk.task.entity.RecurrenceEvent;
import nhk.task.repository.EventRepository;
import nhk.task.repository.RecurrenceEventRepository;
import nhk.user.User;
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


