package nhk.calendar;

import lombok.Builder;
import lombok.Data;

/**
 * Response DTO for the Available Time calculation endpoint.
 */
@Data
@Builder
public class AvailableTimeResponse {

    /** Total available minutes for the requested date (after events and buffer). */
    private int availableMinutes;

    /** Total minutes blocked by fixed events (union of intervals). */
    private int blockedMinutes;

    /** Buffer percentage applied (from user profile). */
    private int bufferPct;

    /** Total minutes in the working window (sleepTime - max(wakeTime, now)). */
    private int workingWindowMinutes;

    /** True if the user has checked in for this date. */
    private boolean checkedIn;

    /** The time the user checked in (if checkedIn is true), formatted as "HH:mm". */
    private String checkinTime;
}
