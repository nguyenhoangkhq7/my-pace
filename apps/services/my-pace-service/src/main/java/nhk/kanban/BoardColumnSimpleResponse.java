package nhk.kanban;

import lombok.Data;

import java.util.Set;

@Data
public class BoardColumnSimpleResponse {
    private String name;
    private int position;
    private Set<TaskSimpleResponse> tasks;
}
