package nhk.calendar;

import lombok.Builder;
import java.util.List;

@Builder
public record AvailableTimeResponse(
    int availableMinutes,
    int blockedMinutes,
    int bufferPct,
    int workingWindowMinutes,
    boolean checkedIn,
    String checkinTime,
    int streak,
    List<TimeInterval> blockedIntervals,
    boolean isPlanConfirmed
) {
    @Builder
    public record TimeInterval(
        String startTime, // "HH:mm"
        String endTime   // "HH:mm"
    ) {}
}
