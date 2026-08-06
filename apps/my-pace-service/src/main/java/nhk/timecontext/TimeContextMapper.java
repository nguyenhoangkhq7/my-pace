package nhk.timecontext;

import nhk.category.CategoryMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = {CategoryMapper.class})
public interface TimeContextMapper {
    TimeContextDto toDto(TimeContext entity);

    TimeContextSlotDto toSlotDto(TimeContextSlot slot);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "timeContext", ignore = true)
    TimeContextSlot toSlotEntity(TimeContextSlotDto slotDto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "slots", ignore = true)
    @Mapping(target = "categories", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    TimeContext toEntity(TimeContextCreateRequest request);
}
