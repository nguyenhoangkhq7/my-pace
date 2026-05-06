package nhk.kanban;

import lombok.Data;

import java.util.Set;

@Data
public class BoardSimpleResponse {
    private String name;
    private String colorCode;
    private Set<BoardColumnSimpleResponse> boardColumns;
}
