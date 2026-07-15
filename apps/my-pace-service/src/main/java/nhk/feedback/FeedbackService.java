package nhk.feedback;

import java.util.UUID;

public interface FeedbackService {
    FeedbackResponse createFeedback(FeedbackRequest request, UUID userId);
}
