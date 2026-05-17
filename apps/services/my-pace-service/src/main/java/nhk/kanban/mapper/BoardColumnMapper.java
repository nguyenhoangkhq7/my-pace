package nhk.kanban.mapper;

import nhk.kanban.dto.BoardColumnSimpleResponse;
import nhk.kanban.dto.CreateBoardColumnRequest;
import nhk.kanban.entity.BoardColumn;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueCheckStrategy;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        uses = TaskMapper.class,
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface BoardColumnMapper {
   BoardColumn toEntity(CreateBoardColumnRequest createBoardColumnRequest);
   BoardColumnSimpleResponse toSimpleResponse(BoardColumn boardColumn);
}


