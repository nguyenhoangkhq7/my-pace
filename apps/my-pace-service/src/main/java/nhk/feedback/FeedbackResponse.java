package nhk.feedback;

import lombok.Builder;
import java.util.UUID;

@Builder
public record FeedbackResponse(
    UUID id,
    UUID userId,
    String category,
    String content
) {}
