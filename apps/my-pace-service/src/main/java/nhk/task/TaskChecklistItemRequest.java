package nhk.task;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;

@Data
public class TaskChecklistItemRequest {
    private UUID id;

    @NotBlank
    private String title;
    
    private Boolean isCompleted;
    private Integer orderIndex;
}
