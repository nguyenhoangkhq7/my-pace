package nhk.planning;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class PlanMyDayRequest {
    private LocalDate planDate;
    private Integer availableMinutes;
    private List<PlanTaskItem> tasks;
    
    @Data
    public static class PlanTaskItem {
        private UUID taskId;
        private Boolean isMit;
        private Integer sortOrder;
    }
}
