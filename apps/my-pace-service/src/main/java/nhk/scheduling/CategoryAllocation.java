package nhk.scheduling;

import lombok.Builder;

import java.util.UUID;

@Builder
public record CategoryAllocation(
    UUID categoryId,
    String categoryName,
    String categoryColor,
    int scheduledMinutes
) {}
