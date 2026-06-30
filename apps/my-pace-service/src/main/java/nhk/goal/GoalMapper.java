package nhk.goal;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface GoalMapper {
    GoalDto toDto(Goal goal);
    Goal toEntity(GoalCreateRequest request);
    void updateFromRequest(GoalUpdateRequest request, @MappingTarget Goal goal);
    
    TimeBoxedGoalDto toTimeBoxedGoalDto(TimeBoxedGoal timeBoxedGoal);
    TimeBoxedGoal toTimeBoxedGoalEntity(TimeBoxedGoalDto dto);
    void updateTimeBoxedGoalFromDto(TimeBoxedGoalDto dto, @MappingTarget TimeBoxedGoal timeBoxedGoal);
    
    MilestoneDto toMilestoneDto(Milestone milestone);
    Milestone toMilestoneEntity(MilestoneDto dto);
    void updateMilestoneFromDto(MilestoneDto dto, @MappingTarget Milestone milestone);
}
