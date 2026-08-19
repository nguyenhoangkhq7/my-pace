package nhk.planning.insight;

import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/daily-plans")
@RequiredArgsConstructor
public class DailyBriefingController {

    private final DailyBriefingService briefingService;

    @GetMapping("/{date}/briefing")
    public DailyBriefingResponse getBriefing(
            @AuthenticationPrincipal UserDetailsCustom principal,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return briefingService.getBriefing(principal.user().getId(), date);
    }
}
