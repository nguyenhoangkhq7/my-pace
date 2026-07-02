package nhk.goal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @GetMapping
    public ResponseEntity<List<GoalDto>> getGoals(@AuthenticationPrincipal UserDetailsCustom userDetails) {
        return ResponseEntity.ok(goalService.getGoals(userDetails));
    }

    @PostMapping
    public ResponseEntity<GoalDto> createGoal(@Valid @RequestBody GoalCreateRequest request,
                                              @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return ResponseEntity.ok(goalService.createGoal(request, userDetails));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalDto> updateGoal(@PathVariable UUID id,
                                              @Valid @RequestBody GoalUpdateRequest request,
                                              @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return ResponseEntity.ok(goalService.updateGoal(id, request, userDetails));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(@PathVariable UUID id,
                                           @AuthenticationPrincipal UserDetailsCustom userDetails) {
        goalService.deleteGoal(id, userDetails);
        return ResponseEntity.ok().build();
    }

}
