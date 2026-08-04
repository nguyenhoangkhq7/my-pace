package nhk.calendar;

import lombok.Builder;
import nhk.category.CategoryDto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Builder
public record FixedEventResponse(
    String id,
    UUID seriesId,
    String title,
    String notes,
    LocalDate occurrenceDate,
    LocalTime startTime,
    LocalTime endTime,
    Boolean isAllDay,
    String recurrenceType,

    List<Integer> recurrenceDaysOfWeek,
    LocalDate recurrenceEndDate,
    boolean isException,
    UUID categoryId,
    CategoryDto category,
    String availabilityStatus
) {}
