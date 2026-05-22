package nhk.task.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import nhk.task.entity.EnergyRequired;
import nhk.task.entity.TaskStatus;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
    private Integer id;
    private Integer userId;
    private Integer categoryId;
    private String categoryName;
    private Integer parentId;
    private String title;
    private Double position;
    private TaskStatus status;
    private Boolean isDone;
    private EnergyRequired energyRequired;
    private Boolean isImportant;
    private Short estimatedMinutes;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    private String description;
    private String attachmentsJson;
    private LocalDateTime detailUpdatedAt;
}

