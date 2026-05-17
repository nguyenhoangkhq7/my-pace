package nhk.kanban.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateBoardRequest {
    @NotBlank(message = "Name is required")
    private String name;
}
