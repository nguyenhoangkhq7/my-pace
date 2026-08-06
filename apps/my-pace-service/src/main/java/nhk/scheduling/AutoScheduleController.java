package nhk.scheduling;

import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/auto-schedule")
@RequiredArgsConstructor
public class AutoScheduleController {

    private final AutoScheduleService autoScheduleService;

    @PostMapping
    public AutoScheduleResponse autoSchedule(
            @RequestBody(required = false) AutoScheduleWeekRequest request,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        LocalDate startDate = request != null ? request.startDate() : null;
        Integer bufferMinutes = (request != null && request.bufferMinutes() != null) ? request.bufferMinutes() : 10;
        Boolean singleDayOnly = request != null && request.singleDayOnly() != null ? request.singleDayOnly() : false;
        return autoScheduleService.autoScheduleWeek(
                userDetails.user().getId(), startDate, bufferMinutes, singleDayOnly);
    }
}
