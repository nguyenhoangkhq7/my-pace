package nhk.stats;

import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import nhk.user.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/overview")
    public ResponseEntity<StatsResponse> getOverview(
            @AuthenticationPrincipal UserDetailsCustom userDetails,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String startDate,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String endDate) {
        User user = userDetails.user();
        StatsResponse response = statsService.getOverview(user, startDate, endDate);
        return ResponseEntity.ok(response);
    }
}
