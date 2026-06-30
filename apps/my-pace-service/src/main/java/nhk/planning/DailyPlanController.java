package nhk.planning;

import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/daily-plans")
@RequiredArgsConstructor
public class DailyPlanController {
    private final DailyPlanService dailyPlanService;

    @GetMapping("/{date}")
    public DailyPlanDto getDailyPlan(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                     @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return dailyPlanService.getDailyPlan(date, userDetails);
    }

    @PostMapping("/plan-my-day")
    public DailyPlanDto planMyDay(@RequestBody PlanMyDayRequest request,
                                  @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return dailyPlanService.planMyDay(request, userDetails);
    }

    @PostMapping("/{date}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelPlan(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                           @AuthenticationPrincipal UserDetailsCustom userDetails) {
        dailyPlanService.cancelPlan(date, userDetails);
    }

    @PutMapping("/tasks/{planTaskId}/toggle-done")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void toggleTaskDone(@PathVariable UUID planTaskId,
                               @AuthenticationPrincipal UserDetailsCustom userDetails) {
        dailyPlanService.toggleTaskDone(planTaskId, userDetails);
    }
}
