package nhk.calendar;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record FixedEventRequest(
    @NotBlank
    @Size(max = 255)
    String title,

    String notes,

    @NotNull
    LocalTime startTime,

    @NotNull
    LocalTime endTime,

    LocalDate eventDate,

    @NotNull
    String recurrenceType,

    List<Integer> recurrenceDaysOfWeek,

    LocalDate recurrenceEndDate
) {}
