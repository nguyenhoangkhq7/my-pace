package nhk.planning;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PlanMyDayRequest(
    LocalDate planDate,
    Integer availableMinutes,
    List<PlanTaskItem> tasks
) {
    public record PlanTaskItem(
        UUID taskId,
        Boolean isMit,
        Integer sortOrder
    ) {}
}
