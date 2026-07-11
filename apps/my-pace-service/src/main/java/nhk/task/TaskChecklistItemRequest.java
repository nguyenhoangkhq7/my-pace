package nhk.task;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TaskChecklistItemRequest {
    @NotBlank
    private String title;
    
    private Boolean isCompleted;
    private Integer orderIndex;
}
