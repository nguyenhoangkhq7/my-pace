package nhk.task;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", uses = {nhk.category.CategoryMapper.class}, unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface TaskMapper {
    TaskDto toDto(Task task);

    @Mapping(target = "checklists", ignore = true)
    Task toEntity(TaskCreateRequest request);

    void updateFromRequest(TaskUpdateRequest request, @MappingTarget Task task);
}
