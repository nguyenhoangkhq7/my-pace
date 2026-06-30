package nhk.timeblock;

import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class TaskTimeBlockDto {
    private UUID id;
    private UUID taskId;
    private UUID dailyPlanId;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private Integer partIndex;
    private Integer totalParts;
}
