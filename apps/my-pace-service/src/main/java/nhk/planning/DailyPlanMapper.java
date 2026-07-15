package nhk.planning;

import nhk.task.TaskMapper;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = {TaskMapper.class}, unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface DailyPlanMapper {
    DailyPlanDto toDto(DailyPlan plan);
    DailyPlanTaskDto toDto(DailyPlanTask task);
}
