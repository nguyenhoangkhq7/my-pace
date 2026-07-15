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

    @GetMapping
    public List<TaskTimeBlockDto> getTimeBlocks(
            @RequestParam UUID planId,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return timeBlockService.getTimeBlocks(planId, userDetails.user().getId());
    }

    @PostMapping("/batch")
    @ResponseStatus(HttpStatus.CREATED)
    public List<TaskTimeBlockDto> saveTimeBlocks(
            @Valid @RequestBody SaveTimeBlocksRequest request,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return timeBlockService.saveTimeBlocks(request, userDetails.user().getId());
    }
}
