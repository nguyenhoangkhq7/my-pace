package nhk.task.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import nhk.task.entity.EnergyRequired;
import nhk.task.entity.TaskStatus;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskCreateRequest {
    @NotBlank
    private String title;
    private Integer categoryId;
    private Integer parentId;
    private TaskStatus status;
    private EnergyRequired energyRequired;
    private Boolean isImportant;
    private Boolean isDone;
    private Double position;
    private Short estimatedMinutes;
    private LocalDateTime dueDate;
    private String description;
    private String attachmentsJson;
}

