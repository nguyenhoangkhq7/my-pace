package nhk.scheduling;

import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/calendar/weekly-allocation")
@RequiredArgsConstructor
public class WeeklyAllocationController {

    private final WeeklyAllocationService weeklyAllocationService;

    @GetMapping
    public WeeklyAllocationSummary getWeeklyAllocation(
            @RequestParam(required = false) Integer bufferMinutes,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return weeklyAllocationService.getWeeklyAllocation(userDetails.user().getId(), bufferMinutes);
    }
}
