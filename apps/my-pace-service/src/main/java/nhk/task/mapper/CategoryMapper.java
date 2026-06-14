package nhk.task.mapper;

import nhk.task.dto.request.CategoryCreateRequest;
import nhk.task.dto.request.CategoryUpdateRequest;
import nhk.task.dto.response.CategoryResponse;
import nhk.task.entity.Category;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    Category toEntity(CategoryCreateRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    void updateEntity(CategoryUpdateRequest request, @MappingTarget Category category);

    @Mapping(target = "userId", source = "user.id")
    CategoryResponse toResponse(Category category);
}

