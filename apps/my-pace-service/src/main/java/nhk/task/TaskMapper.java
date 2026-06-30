package nhk.task;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", uses = {nhk.category.CategoryMapper.class}, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface TaskMapper {
    TaskDto toDto(Task task);
    Task toEntity(TaskCreateRequest request);
    void updateFromRequest(TaskUpdateRequest request, @MappingTarget Task task);
}
