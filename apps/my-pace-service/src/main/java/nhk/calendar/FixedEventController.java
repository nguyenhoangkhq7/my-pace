package nhk.calendar;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class FixedEventController {

    private final FixedEventService service;

    // ─── Events ──────────────────────────────────────────────────────────────

    /**
     * GET /api/calendar/events?start=YYYY-MM-DD&end=YYYY-MM-DD
     * Returns all expanded occurrences (including recurring) in the date range.
     */
    @GetMapping("/events")
    public ResponseEntity<List<FixedEventResponse>> getEvents(
            @AuthenticationPrincipal UserDetailsCustom principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(service.getEventsInRange(principal.user().getId(), start, end));
    }

    /**
     * POST /api/calendar/events
     * Creates a new fixed event (or recurring series).
     */
    @PostMapping("/events")
    public ResponseEntity<FixedEventResponse> createEvent(
            @AuthenticationPrincipal UserDetailsCustom principal,
            @Valid @RequestBody FixedEventRequest request) {
        FixedEventResponse created = service.createEvent(principal.user().getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/calendar/events/{id}
     * Updates the entire series and clears all exceptions.
     */
    @PutMapping("/events/{id}")
    public ResponseEntity<FixedEventResponse> updateAllOccurrences(
            @AuthenticationPrincipal UserDetailsCustom principal,
            @PathVariable UUID id,
            @Valid @RequestBody FixedEventRequest request) {
        return ResponseEntity.ok(service.updateAllOccurrences(principal.user().getId(), id, request));
    }

    /**
     * PATCH /api/calendar/events/{id}/exceptions/{date}
     * Updates (or creates) an exception for one specific occurrence date.
     */
    @PatchMapping("/events/{id}/exceptions/{date}")
    public ResponseEntity<FixedEventResponse> updateSingleOccurrence(
            @AuthenticationPrincipal UserDetailsCustom principal,
            @PathVariable UUID id,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody FixedEventExceptionRequest request) {
        return ResponseEntity.ok(
                service.updateSingleOccurrence(principal.user().getId(), id, date, request));
    }

    /**
     * DELETE /api/calendar/events/{id}
     * Deletes the entire recurring series (and all its exceptions via CASCADE).
     */
    @DeleteMapping("/events/{id}")
    public ResponseEntity<Void> deleteAllOccurrences(
            @AuthenticationPrincipal UserDetailsCustom principal,
            @PathVariable UUID id) {
        service.deleteAllOccurrences(principal.user().getId(), id);
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/calendar/events/{id}/exceptions/{date}
     * Soft-deletes one specific occurrence of a recurring series.
     */
    @DeleteMapping("/events/{id}/exceptions/{date}")
    public ResponseEntity<Void> deleteSingleOccurrence(
            @AuthenticationPrincipal UserDetailsCustom principal,
            @PathVariable UUID id,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        service.deleteSingleOccurrence(principal.user().getId(), id, date);
        return ResponseEntity.noContent().build();
    }

    // ─── Available Time & Checkin ─────────────────────────────────────────────

    /**
     * GET /api/calendar/available-time?date=YYYY-MM-DD
     * Returns the available working time for the given date after subtracting fixed events and buffer.
     */
    @GetMapping("/available-time")
    public ResponseEntity<AvailableTimeResponse> getAvailableTime(
            @AuthenticationPrincipal UserDetailsCustom principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.getAvailableTime(principal.user().getId(), date));
    }

    /**
     * POST /api/calendar/checkin
     * Performs a daily checkin for today or a specific date, recalculating the available time.
     * Optional body parameter checkinTime (format: "HH:mm"). If null, defaults to the current server time.
     */
    @PostMapping("/checkin")
    public ResponseEntity<AvailableTimeResponse> checkin(
            @AuthenticationPrincipal UserDetailsCustom principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) LocalTime checkinTime) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(service.checkin(principal.user().getId(), targetDate, checkinTime));
    }
}
