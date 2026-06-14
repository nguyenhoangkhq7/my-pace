package nhk.task.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryCreateRequest {
    @NotBlank
    private String name;
    private LocalTime preferredStartTime;
    private LocalTime preferredEndTime;
}

