package nhk.planning;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ReviewPlanRequest(
    LocalDate today,
    List<TaskReviewItem> taskReviews
) {
    public record TaskReviewItem(
        UUID taskId,
        String action
    ) {}
}
