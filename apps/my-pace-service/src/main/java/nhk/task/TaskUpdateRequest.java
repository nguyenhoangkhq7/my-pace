package nhk.task;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class TaskUpdateRequest {
    @NotBlank(message = "Title is required")
    private String title;
    private UUID goalId;
    private UUID categoryId;
    private Integer estimatedMinutes;
    private Integer actualMinutes;
    private Boolean isUrgent;
    private Boolean isImportant;
    private String status;
    private LocalDate dueDate;
    private String notes;
}
