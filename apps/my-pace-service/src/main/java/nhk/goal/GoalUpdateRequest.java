package nhk.goal;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;
import jakarta.validation.constraints.Size;

@Data
public class GoalUpdateRequest {
    @Size(max = 255)
    private String title;

    @Size(max = 50)
    private String status;

    private LocalDate startDate;
    private LocalDate endDate;
    
    private java.util.UUID categoryId;
    private Boolean autoCreateTask;
    private Integer durationMinutes;
    private String daysOfWeek;
    private java.time.LocalTime preferTime;
}
