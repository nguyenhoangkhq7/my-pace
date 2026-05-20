package nhk.task.controller;

import lombok.RequiredArgsConstructor;
import nhk.common.ApiResponse;
import nhk.task.dto.response.CalendarEventResponse;
import nhk.task.service.EventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<CalendarEventResponse>>> getUpcomingEvents() {
        return ResponseEntity.ok(ApiResponse.ok(eventService.getUpcomingEvents()));
    }
}

