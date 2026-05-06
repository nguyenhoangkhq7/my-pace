package nhk.kanban;

import lombok.Data;

@Data
public class CreateBoardRequest {
    private String name;
    private String colorCode;
}
