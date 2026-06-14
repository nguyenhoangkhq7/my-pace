package nhk.task.mapper;

import nhk.task.dto.request.TaskCreateRequest;
import nhk.task.dto.request.TaskUpdateRequest;
import nhk.task.dto.response.TaskResponse;
import nhk.task.entity.Task;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface TaskMapper {
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "detail", ignore = true)
    Task toEntity(TaskCreateRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "detail", ignore = true)
    void updateEntity(TaskUpdateRequest request, @MappingTarget Task task);

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "categoryId", source = "category.id")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "parentId", source = "parent.id")
    @Mapping(target = "description", source = "detail.description")
    @Mapping(target = "attachmentsJson", source = "detail.attachmentsJson")
    @Mapping(target = "detailUpdatedAt", source = "detail.updatedAt")
    TaskResponse toResponse(Task task);
}

