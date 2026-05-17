package nhk.kanban.dto;

import lombok.Data;

import java.time.Instant;

@Data
public class TaskSimpleResponse {
    private Integer id;
    private Integer position;
    private String title;
    private Integer energyRequired;
    private Integer priority;
    private Instant dueDate;
    private Short estimatedMinutes;
    private ContextSimpleResponse context;
}
