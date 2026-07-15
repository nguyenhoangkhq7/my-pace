package nhk.feedback;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;

    @Override
    @Transactional
    public FeedbackResponse createFeedback(FeedbackRequest request, UUID userId) {
        Feedback feedback = Feedback.builder()
                .userId(userId)
                .category(request.category())
                .content(request.content())
                .build();
        
        Feedback saved = feedbackRepository.save(feedback);
        return FeedbackResponse.builder()
                .id(saved.getId())
                .userId(saved.getUserId())
                .category(saved.getCategory())
                .content(saved.getContent())
                .build();
    }
}
