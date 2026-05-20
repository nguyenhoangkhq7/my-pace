package nhk.task.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryUpdateRequest {
    private String name;
    private LocalTime preferredStartTime;
    private LocalTime preferredEndTime;
}

