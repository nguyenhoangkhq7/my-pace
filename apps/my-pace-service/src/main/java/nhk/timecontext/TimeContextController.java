package nhk.timecontext;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/time-contexts")
@RequiredArgsConstructor
public class TimeContextController {
    private final TimeContextService timeContextService;

    @GetMapping
    public List<TimeContextDto> getTimeContexts(@AuthenticationPrincipal UserDetailsCustom userDetails) {
        return timeContextService.getTimeContexts(userDetails.user().getId());
    }

    @GetMapping("/{id}")
    public TimeContextDto getTimeContext(@PathVariable UUID id,
                                         @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return timeContextService.getTimeContext(id, userDetails.user().getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TimeContextDto createTimeContext(@Valid @RequestBody TimeContextCreateRequest request,
                                            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return timeContextService.createTimeContext(request, userDetails.user().getId());
    }

    @PutMapping("/{id}")
    public TimeContextDto updateTimeContext(@PathVariable UUID id,
                                            @Valid @RequestBody TimeContextUpdateRequest request,
                                            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return timeContextService.updateTimeContext(id, request, userDetails.user().getId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTimeContext(@PathVariable UUID id,
                                   @AuthenticationPrincipal UserDetailsCustom userDetails) {
        timeContextService.deleteTimeContext(id, userDetails.user().getId());
    }
}
