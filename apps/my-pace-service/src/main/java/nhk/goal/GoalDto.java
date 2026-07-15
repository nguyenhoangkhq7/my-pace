package nhk.goal;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

public record GoalDto(
    UUID id,
    String title,
    String goalType,
    String status,
    LocalDate startDate,
    LocalDate endDate,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    UUID categoryId,
    Integer progressPct,
    Boolean autoCreateTask,
    Integer durationMinutes,
    String daysOfWeek,
    LocalTime preferTime
) {}
