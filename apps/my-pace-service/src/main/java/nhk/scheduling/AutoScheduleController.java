package nhk.scheduling;

import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auto-schedule")
@RequiredArgsConstructor
public class AutoScheduleController {

    private final AutoScheduleService autoScheduleService;

    @PostMapping
    public AutoScheduleResponse autoSchedule(
            @RequestBody(required = false) AutoScheduleWeekRequest request,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        Integer bufferMinutes = (request != null && request.bufferMinutes() != null) 
                ? request.bufferMinutes() 
                : userDetails.user().getBufferMinutes();
        return autoScheduleService.autoSchedule(
                userDetails.user().getId(), bufferMinutes);
    }

    @PostMapping("/preview-slack")
    public PreviewSlackResponse previewSlack(
            @RequestBody PreviewSlackRequest request,
            @RequestParam(required = false) Integer bufferMinutes,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        Integer buffer = bufferMinutes != null ? bufferMinutes : userDetails.user().getBufferMinutes();
        return autoScheduleService.previewSlack(userDetails.user().getId(), request, buffer);
    }

    @PostMapping("/batch-slack")
    public BatchSlackResponse batchSlack(
            @RequestBody BatchSlackRequest request,
            @RequestParam(required = false) Integer bufferMinutes,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        Integer buffer = bufferMinutes != null ? bufferMinutes : userDetails.user().getBufferMinutes();
        return autoScheduleService.batchSlack(userDetails.user().getId(), request, buffer);
    }
}

