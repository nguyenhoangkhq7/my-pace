package nhk.category;

import java.util.UUID;

public record CategoryDto(
    UUID id,
    String name,
    String color
) {}
