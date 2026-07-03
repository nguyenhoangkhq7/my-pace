package nhk.stats;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class StatsResponse {
    private Map<String, Integer> matrixTime; // keys: "q1", "q2", "q3", "q4"
    private Map<String, Integer> categoryTime; // keys: category name, value: minutes
    private Double completionRate; // percentage 0-100
    private Integer streak; // consecutive days
}
