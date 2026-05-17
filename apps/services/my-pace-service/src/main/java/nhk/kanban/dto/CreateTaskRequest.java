package nhk.kanban.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import nhk.kanban.entity.ImpactType;

import java.time.Instant;

@Data
public class CreateTaskRequest {
   @NotNull(message = "Board is required")
   private Integer boardId;
   @NotNull(message = "Board is required")
   private Integer columnId;
   @NotNull(message = "Position is required")
   private Integer position;
   @NotBlank(message = "Title is required")
   private String title;
   private String description;
   private Integer contextId;
   private Integer energyRequired;
   private ImpactType impactType;
   private Short estimatedMinutes;
   private Integer priority;
   private Boolean isRecurring;
   private Instant dueDate;
}


