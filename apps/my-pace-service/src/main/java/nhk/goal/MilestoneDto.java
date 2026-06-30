package nhk.goal;

import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class MilestoneDto {
    private UUID id;
    private String title;
    private Integer sortOrder;
    private Boolean isDone;
    private OffsetDateTime doneAt;
}
