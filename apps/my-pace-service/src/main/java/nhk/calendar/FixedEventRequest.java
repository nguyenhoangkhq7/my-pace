package nhk.calendar;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record FixedEventRequest(
    @NotBlank
    @Size(max = 255)
    String title,

    String notes,

    LocalTime startTime,

    LocalTime endTime,

    Boolean isAllDay,

    LocalDate eventDate,


    @NotNull
    String recurrenceType,

    List<Integer> recurrenceDaysOfWeek,

    LocalDate recurrenceEndDate,

    UUID categoryId,

    String availabilityStatus
) {}
