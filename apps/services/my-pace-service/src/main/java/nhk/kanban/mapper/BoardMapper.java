package nhk.kanban.mapper;

import nhk.kanban.dto.BoardSimpleResponse;
import nhk.kanban.dto.CreateBoardRequest;
import nhk.kanban.entity.Board;
import org.mapstruct.Mapper;

import org.mapstruct.NullValueCheckStrategy;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        uses = BoardColumnMapper.class,
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface BoardMapper {
    Board toEntity(CreateBoardRequest createBoardRequest);
    BoardSimpleResponse toSimpleResponse(Board board);
    List<BoardSimpleResponse> toListSimpleResponse(List<Board> board);
}
