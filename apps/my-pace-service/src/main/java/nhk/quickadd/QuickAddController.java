package nhk.quickadd;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quick-add")
@RequiredArgsConstructor
public class QuickAddController {

    private final QuickAddService quickAddService;

    @PostMapping
    public QuickAddResponse parseQuickAdd(
            @AuthenticationPrincipal UserDetailsCustom userDetails,
            @Valid @RequestBody QuickAddRequest request
    ) {
        return quickAddService.parse(request, userDetails.user().getId(), userDetails.user().getTimezone());
    }
}
