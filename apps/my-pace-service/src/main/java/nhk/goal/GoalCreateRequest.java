package nhk.goal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record GoalCreateRequest(
    @NotNull
    @Size(max = 255)
    String title,

    @NotNull
    @Size(max = 50)
    String goalType,
    
    LocalDate startDate,
    LocalDate endDate,
    
    @NotNull
    UUID categoryId,
    
    Boolean autoCreateTask,
    Integer durationMinutes,
    String daysOfWeek,
    LocalTime preferTime
) {}
