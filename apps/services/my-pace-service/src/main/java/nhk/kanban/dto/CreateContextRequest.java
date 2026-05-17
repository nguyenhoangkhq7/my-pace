package nhk.kanban.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateContextRequest {
   @NotBlank(message = "Name is required")
   private String name;
   @NotBlank(message = "Color code is required")
   private String colorCode;
}

