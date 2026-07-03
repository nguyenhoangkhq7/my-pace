package nhk.category;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryUpdateRequest {
    @NotBlank(message = "Name is required")
    private String name;
    
    private String color;
}
