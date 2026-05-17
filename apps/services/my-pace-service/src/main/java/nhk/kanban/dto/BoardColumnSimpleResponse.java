package nhk.kanban.dto;

import lombok.Data;

import java.util.Set;

@Data
public class BoardColumnSimpleResponse {
    private Integer id;
    private String name;
    private Integer position;
    private Set<TaskSimpleResponse> tasks;
}
