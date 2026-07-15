package nhk.goal;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record GoalUpdateRequest(
    @Size(max = 255)
    String title,

    @Size(max = 50)
    String status,

    LocalDate startDate,
    LocalDate endDate,
    
    UUID categoryId,
    Boolean autoCreateTask,
    Integer durationMinutes,
    String daysOfWeek,
    LocalTime preferTime
) {}
