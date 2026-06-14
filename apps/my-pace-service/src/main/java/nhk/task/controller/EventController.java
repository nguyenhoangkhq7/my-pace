package nhk.task.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nhk.common.ApiResponse;
import nhk.task.dto.request.EventRequest;
import nhk.task.dto.response.CalendarEventResponse;
import nhk.task.service.EventService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CalendarEventResponse>>> getEvents() {
        return ResponseEntity.ok(ApiResponse.ok(eventService.getEvents()));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<CalendarEventResponse>>> getUpcomingEvents() {
        return ResponseEntity.ok(ApiResponse.ok(eventService.getUpcomingEvents()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> getEvent(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(eventService.getEvent(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CalendarEventResponse>> createEvent(@Valid @RequestBody EventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(eventService.createEvent(request), "Event created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> updateEvent(
            @PathVariable Integer id,
            @Valid @RequestBody EventRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(eventService.updateEvent(id, request), "Event updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable Integer id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Event deleted successfully"));
    }
}
