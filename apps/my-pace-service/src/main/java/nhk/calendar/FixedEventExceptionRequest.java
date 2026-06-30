package nhk.calendar;

import lombok.Data;

import java.time.LocalTime;

/**
 * Request DTO for patching a single occurrence of a recurring event.
 * All fields are optional — only non-null fields will be applied.
 */
@Data
public class FixedEventExceptionRequest {

    private String overrideTitle;
    private String overrideNotes;
    private LocalTime overrideStartTime;
    private LocalTime overrideEndTime;

    /** Set to true to soft-delete this occurrence. */
    private Boolean isDeleted;
}
