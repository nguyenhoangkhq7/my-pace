package nhk.quickadd;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/quick-add")
@RequiredArgsConstructor
public class QuickAddController {

    private static final UUID FALLBACK_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final QuickAddService quickAddService;

    @PostMapping
    public QuickAddResponse parseQuickAdd(
            @AuthenticationPrincipal UserDetailsCustom userDetails,
            @Valid @RequestBody QuickAddRequest request
    ) {
        UUID userId = (userDetails != null && userDetails.user() != null)
                ? userDetails.user().getId()
                : FALLBACK_USER_ID;
        String timezone = (userDetails != null && userDetails.user() != null && userDetails.user().getTimezone() != null)
                ? userDetails.user().getTimezone()
                : (request.userTimezone() != null && !request.userTimezone().isBlank() ? request.userTimezone() : "Asia/Ho_Chi_Minh");

        return quickAddService.parse(request, userId, timezone);
    }
}
