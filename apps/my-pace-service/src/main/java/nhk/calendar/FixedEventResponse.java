package nhk.calendar;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Represents one **expanded occurrence** of a fixed event.
 * For non-recurring events seriesId == id.
 * For recurring events, id is the occurrence key (seriesId_date) and seriesId
 * is the UUID of the parent fixed_events row.
 */
@Data
@Builder
public class FixedEventResponse {

    /** Unique occurrence identifier sent to frontend: "{seriesId}_{occurrenceDate}" */
    private String id;

    /** UUID of the fixed_events row (the series). */
    private UUID seriesId;

    private String title;
    private String notes;
    private LocalDate occurrenceDate;
    private LocalTime startTime;
    private LocalTime endTime;

    /** NONE | DAILY | WEEKLY | CUSTOM */
    private String recurrenceType;

    /** Day-of-week numbers (1-7) for WEEKLY/CUSTOM. */
    private List<Integer> recurrenceDaysOfWeek;

    private LocalDate recurrenceEndDate;

    /** True if this occurrence comes from an exception row. */
    private boolean isException;
}
