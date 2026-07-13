package nhk.goal;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class GoalCreateRequest {
    @NotNull
    @Size(max = 255)
    private String title;

    @NotNull
    @Size(max = 50)
    private String goalType;
    
    private LocalDate startDate;
    private LocalDate endDate;
    
    @NotNull
    private java.util.UUID categoryId;
    
    private Boolean autoCreateTask;
    private Integer durationMinutes;
    private String daysOfWeek;
    private java.time.LocalTime preferTime;
}
