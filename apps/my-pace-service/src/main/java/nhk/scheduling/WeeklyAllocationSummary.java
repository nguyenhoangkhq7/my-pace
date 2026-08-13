package nhk.scheduling;

import lombok.Builder;

import java.util.List;

@Builder
public record WeeklyAllocationSummary(
    int totalAvailableMinutes,
    int totalScheduledMinutes,
    int bufferMinutes,
    int freeMinutes,
    List<CategoryAllocation> byCategory
) {}
