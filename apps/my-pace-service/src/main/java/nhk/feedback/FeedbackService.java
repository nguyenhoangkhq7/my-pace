package nhk.feedback;

import lombok.RequiredArgsConstructor;
import nhk.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;

    @Transactional
    public Feedback createFeedback(FeedbackRequest request, User user) {
        Feedback feedback = Feedback.builder()
                .userId(user.getId())
                .category(request.getCategory())
                .content(request.getContent())
                .build();
        
        return feedbackRepository.save(feedback);
    }
}
