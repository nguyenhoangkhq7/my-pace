package nhk.kanban.mapper;

import nhk.kanban.dto.CreateTaskRequest;
import nhk.kanban.dto.TaskSimpleResponse;
import nhk.kanban.entity.Task;
import org.mapstruct.*;

@Mapper(
        componentModel = "spring",
        uses = ContextMapper.class,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface TaskMapper {
   TaskSimpleResponse toSimpleResponse(Task task);

   @Mapping(target = "id", ignore = true)
   @Mapping(target = "user", ignore = true)
   @Mapping(target = "column", ignore = true)
   @Mapping(target = "context", ignore = true)
   @Mapping(target = "taskRecurrences", ignore = true)
   @Mapping(target = "timeBlocks", ignore = true)
   void updateEntity(CreateTaskRequest request, @MappingTarget Task task);
}


