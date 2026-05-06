package nhk.kanban;

import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BoardMapper {
    Board toEntity(CreateBoardRequest createBoardRequest);
    BoardSimpleResponse toSimpleResponse(Board board);
    List<BoardSimpleResponse> toListSimpleResponse(List<Board> board);
    BoardColumnSimpleResponse toColumnSimpleResponse(BoardColumn boardColumn);
    TaskSimpleResponse toTaskSimpleResponse(Task task);
}
