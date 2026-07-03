package nhk.feedback;

import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feedbacks")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<Feedback> createFeedback(
            @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal UserDetailsCustom userDetails) {
        Feedback feedback = feedbackService.createFeedback(request, userDetails.user());
        return ResponseEntity.status(HttpStatus.CREATED).body(feedback);
    }
}
