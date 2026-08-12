package nhk.timelog;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nhk.timelog.dto.CreateTimeLogRequest;
import nhk.timelog.dto.TimeLogResponse;
import nhk.timelog.dto.UpdateTimeLogRequest;
import nhk.user.UserDetailsCustom;
import nhk.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/time-logs")
@RequiredArgsConstructor
public class TimeLogController {

    private final TimeLogService timeLogService;
    private final UserRepository userRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TimeLogResponse createTimeLog(
            @Valid @RequestBody CreateTimeLogRequest request,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return timeLogService.createTimeLog(request, userDetails.user().getId());
    }

    @GetMapping
    public List<TimeLogResponse> getTimeLogs(
            @RequestParam(required = false) UUID taskId,
            @RequestParam(required = false) UUID blockId,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        if (taskId != null) {
            return timeLogService.getByTaskId(taskId, userDetails.user().getId());
        }
        if (blockId != null) {
            return timeLogService.getByTimeBlockId(blockId, userDetails.user().getId());
        }
        return List.of();
    }

    // A4: Daily focus summary — total logged minutes for the authenticated user on a given date
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Integer>> getDailySummary(
            @RequestParam String date,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        nhk.user.User user = userRepository.findById(userDetails.user().getId())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        ZoneId zoneId = ZoneId.of(
                user.getTimezone() != null && !user.getTimezone().isBlank() ? user.getTimezone() : "UTC"
        );
        int totalMinutes = timeLogService.getDailySummary(userDetails.user().getId(), date, zoneId);
        return ResponseEntity.ok(Map.of("totalMinutes", totalMinutes));
    }

    @PutMapping("/{id}")
    public TimeLogResponse updateTimeLog(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTimeLogRequest request,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return timeLogService.updateTimeLog(id, request, userDetails.user().getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTimeLog(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        timeLogService.deleteTimeLog(id, userDetails.user().getId());
    }
}
