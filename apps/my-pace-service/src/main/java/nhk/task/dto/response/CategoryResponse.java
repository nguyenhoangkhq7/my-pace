package nhk.task.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private Integer id;
    private Integer userId;
    private String name;
    private LocalTime preferredStartTime;
    private LocalTime preferredEndTime;
}

