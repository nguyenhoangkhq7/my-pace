package nhk.task;

import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class TaskUpdateRequest {
    private String title;
    private UUID goalId;
    private Integer estimatedMinutes;
    private Integer actualMinutes;
    private Boolean isUrgent;
    private Boolean isImportant;
    private String status;
    private LocalDate dueDate;
    private String notes;
}
