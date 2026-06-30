package nhk.task;

import lombok.Data;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class TaskDto {
    private UUID id;
    private UUID userId;
    private UUID goalId;
    private String title;
    private Integer estimatedMinutes;
    private Integer actualMinutes;
    private Boolean isUrgent;
    private Boolean isImportant;
    private String status;
    private LocalDate dueDate;
    private String notes;
    private OffsetDateTime doneAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
