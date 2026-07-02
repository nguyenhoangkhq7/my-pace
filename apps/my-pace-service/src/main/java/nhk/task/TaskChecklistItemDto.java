package nhk.task;

import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class TaskChecklistItemDto {
    private UUID id;
    private UUID taskId;
    private String title;
    private Boolean isCompleted;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
