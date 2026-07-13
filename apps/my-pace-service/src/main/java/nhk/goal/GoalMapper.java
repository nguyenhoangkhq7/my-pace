package nhk.goal;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface GoalMapper {
    GoalDto toDto(Goal goal);
    Goal toEntity(GoalCreateRequest request);
    void updateFromRequest(GoalUpdateRequest request, @MappingTarget Goal goal);
}
