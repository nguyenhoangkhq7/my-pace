package nhk.kanban.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateBoardColumnRequest {
   @NotNull(message = "Board is required")
   private Integer boardId;
   @NotBlank(message = "Name is required")
   private String name;
   @NotNull(message = "Position is required")
   private Integer position;
}

