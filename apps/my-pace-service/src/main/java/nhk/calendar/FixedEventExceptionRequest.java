package nhk.calendar;

import java.time.LocalTime;
import java.util.UUID;

public record FixedEventExceptionRequest(
    String overrideTitle,
    String overrideNotes,
    LocalTime overrideStartTime,
    LocalTime overrideEndTime,
    Boolean overrideIsAllDay,
    Boolean isDeleted,

    UUID overrideCategoryId,
    String overrideAvailabilityStatus
) {}
