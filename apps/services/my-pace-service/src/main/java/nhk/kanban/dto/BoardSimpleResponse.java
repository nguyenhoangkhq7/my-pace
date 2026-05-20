package nhk.kanban.dto;

import lombok.Data;

import java.time.Instant;
import java.util.Set;

@Data
public class BoardSimpleResponse {
    private Integer id;
    private String name;
    private Set<BoardColumnSimpleResponse> boardColumns;
}
