package nhk.category;

import java.util.UUID;

public record CategoryDto(
    UUID id,
    String name,
    String color,
    UUID timeContextId
) {
    public CategoryDto(UUID id, String name, String color) {
        this(id, name, color, null);
    }
}
