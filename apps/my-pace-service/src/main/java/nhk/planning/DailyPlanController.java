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
        return dailyPlanService.getDailyPlan(date, userDetails.user().getId());
    }

    @GetMapping("/unreviewed")
    public DailyPlanDto getUnreviewedPlan(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate today,
                                          @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return dailyPlanService.getUnreviewedPlan(today, userDetails.user().getId());
    }

    @PostMapping("/plan-my-day")
    public DailyPlanDto planMyDay(@RequestBody PlanMyDayRequest request,
                                  @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return dailyPlanService.planMyDay(request, userDetails.user().getId());
    }

    @PostMapping("/{date}/confirm")
    public DailyPlanDto confirmPlan(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                    @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return dailyPlanService.confirmPlan(date, userDetails.user().getId());
    }

    @PostMapping("/{date}/unconfirm")
    public DailyPlanDto unconfirmPlan(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                      @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return dailyPlanService.unconfirmPlan(date, userDetails.user().getId());
    }

    @PostMapping("/{date}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelPlan(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                           @AuthenticationPrincipal UserDetailsCustom userDetails) {
        dailyPlanService.cancelPlan(date, userDetails.user().getId());
    }

    @PostMapping("/{date}/review")
    public DailyPlanDto reviewPlan(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                   @RequestBody(required = false) ReviewPlanRequest request,
                                   @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return dailyPlanService.reviewPlan(date, request, userDetails.user().getId());
    }

    @PutMapping("/tasks/{planTaskId}/toggle-done")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void toggleTaskDone(@PathVariable UUID planTaskId,
                               @AuthenticationPrincipal UserDetailsCustom userDetails) {
        dailyPlanService.toggleTaskDone(planTaskId, userDetails.user().getId());
    }
}
