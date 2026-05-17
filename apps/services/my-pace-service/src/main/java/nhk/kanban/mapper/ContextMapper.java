package nhk.kanban.mapper;

import nhk.kanban.dto.ContextSimpleResponse;
import nhk.kanban.dto.CreateContextRequest;
import nhk.kanban.entity.Context;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueCheckStrategy;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface ContextMapper {
   Context toEntity(CreateContextRequest createContextRequest);
   ContextSimpleResponse toSimpleResponse(Context context);
}


