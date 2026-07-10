package nhk.goal;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface GoalMapper {
    GoalDto toDto(Goal goal);
    Goal toEntity(GoalCreateRequest request);
    void updateFromRequest(GoalUpdateRequest request, @MappingTarget Goal goal);
    
    TimeBoxedGoalDto toTimeBoxedGoalDto(TimeBoxedGoal timeBoxedGoal);
    TimeBoxedGoal toTimeBoxedGoalEntity(TimeBoxedGoalDto dto);
    void updateTimeBoxedGoalFromDto(TimeBoxedGoalDto dto, @MappingTarget TimeBoxedGoal timeBoxedGoal);
    
    MilestoneGoalDto toMilestoneGoalDto(MilestoneGoal milestoneGoal);
    MilestoneGoal toMilestoneGoalEntity(MilestoneGoalDto dto);
    void updateMilestoneGoalFromDto(MilestoneGoalDto dto, @MappingTarget MilestoneGoal milestoneGoal);
}
