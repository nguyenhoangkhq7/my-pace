package nhk.calendar;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class FixedEventRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    private String notes;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    /**
     * Required for non-recurring events (NONE).
     * For recurring events, this is the series start date (optional, defaults to today if null).
     */
    private LocalDate eventDate;

    /**
     * NONE | DAILY | WEEKLY | CUSTOM
     */
    @NotNull
    private String recurrenceType;

    /**
     * Day-of-week numbers for WEEKLY / CUSTOM recurrence.
     * 1 = Monday … 7 = Sunday (ISO standard).
     * Empty/null for NONE or DAILY.
     */
    private List<Integer> recurrenceDaysOfWeek;

    /** End date for the recurring series. Null = repeat indefinitely. */
    private LocalDate recurrenceEndDate;
}
