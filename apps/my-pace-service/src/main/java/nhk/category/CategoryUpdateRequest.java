package nhk.category;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CategoryUpdateRequest(
    @NotBlank(message = "Name is required")
    String name,
    
    String color,

    UUID timeContextId
) {}
