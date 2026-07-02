package nhk.task;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class TaskCreateRequest {
    @NotBlank(message = "Title is required")
    private String title;
    private UUID goalId;
    private UUID categoryId;
    private Integer estimatedMinutes;
    private Boolean isUrgent;
    private Boolean isImportant;
    private LocalDate dueDate;
    private String status;
    private String notes;
}
