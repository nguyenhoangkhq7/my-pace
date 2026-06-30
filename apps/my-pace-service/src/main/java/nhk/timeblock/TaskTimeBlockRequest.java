package nhk.timeblock;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class TaskTimeBlockRequest {

    @NotNull
    private UUID taskId;

    @NotNull
    private UUID dailyPlanId;

    @NotNull
    private OffsetDateTime startTime;

    @NotNull
    private OffsetDateTime endTime;

    private Integer partIndex = 1;

    private Integer totalParts = 1;
}
