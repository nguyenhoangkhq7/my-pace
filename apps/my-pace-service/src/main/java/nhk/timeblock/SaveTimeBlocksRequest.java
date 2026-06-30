package nhk.timeblock;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class SaveTimeBlocksRequest {
    private UUID dailyPlanId;
    private List<TaskTimeBlockRequest> blocks;
}
