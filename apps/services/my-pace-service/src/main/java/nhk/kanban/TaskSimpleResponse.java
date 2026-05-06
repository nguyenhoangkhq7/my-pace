package nhk.kanban;

import lombok.Data;

import java.time.Instant;

@Data
public class TaskSimpleResponse {
    private Integer position;
    private String title;
    private Integer energyRequired;
    private ImpactType impactType;
    private Short estimatedMinutes;
    private Integer priority;
    private Instant dueDate;
    private Instant createdAt;
}
