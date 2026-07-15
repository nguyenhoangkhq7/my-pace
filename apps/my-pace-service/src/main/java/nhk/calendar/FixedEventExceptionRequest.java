package nhk.calendar;

import java.time.LocalTime;

public record FixedEventExceptionRequest(
    String overrideTitle,
    String overrideNotes,
    LocalTime overrideStartTime,
    LocalTime overrideEndTime,
    Boolean isDeleted
) {}
