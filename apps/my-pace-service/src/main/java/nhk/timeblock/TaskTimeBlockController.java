package nhk.timeblock;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/time-blocks")
@RequiredArgsConstructor
public class TaskTimeBlockController {

    private final TaskTimeBlockService timeBlockService;

    @GetMapping("/range")
    public List<TaskTimeBlockDto> getTimeBlocks(
            @RequestParam java.time.LocalDate startDate,
            @RequestParam java.time.LocalDate endDate,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return timeBlockService.getTimeBlocks(startDate, endDate, userDetails.user().getId());
    }

    @PostMapping("/batch")
    @ResponseStatus(HttpStatus.CREATED)
    public List<TaskTimeBlockDto> saveTimeBlocks(
            @Valid @RequestBody SaveTimeBlocksRequest request,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return timeBlockService.saveTimeBlocks(request, userDetails.user().getId());
    }

    public record UpdateTimeBlockProgressRequest(Integer actualMinutes, Boolean isCompleted) {}
    public record SplitTimeBlockRequest(Integer splitAtMinutes) {}

    @PatchMapping("/{id}/progress")
    public TaskTimeBlockDto updateProgress(
            @PathVariable UUID id,
            @RequestBody UpdateTimeBlockProgressRequest request,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return timeBlockService.updateTimeBlockProgress(id, request.actualMinutes(), request.isCompleted(), userDetails.user().getId());
    }

    @PostMapping("/{id}/split")
    public List<TaskTimeBlockDto> splitTimeBlock(
            @PathVariable UUID id,
            @RequestBody(required = false) SplitTimeBlockRequest request,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        Integer splitAt = request != null ? request.splitAtMinutes() : null;
        return timeBlockService.splitTimeBlock(id, splitAt, userDetails.user().getId());
    }

    public record ToggleTimeBlockLockRequest(String availabilityStatus) {}

    @PatchMapping("/{id}/lock-status")
    public TaskTimeBlockDto toggleLockStatus(
            @PathVariable UUID id,
            @RequestBody ToggleTimeBlockLockRequest request,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return timeBlockService.toggleTimeBlockLockStatus(id, request.availabilityStatus(), userDetails.user().getId());
    }

    public record UpdateTimeBlockRequest(java.time.LocalDateTime startTime, java.time.LocalDateTime endTime, String availabilityStatus) {}

    @PatchMapping("/{id}")
    public TaskTimeBlockDto updateTimeBlock(
            @PathVariable UUID id,
            @RequestBody UpdateTimeBlockRequest request,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return timeBlockService.updateTimeBlock(id, request, userDetails.user().getId());
    }
}
