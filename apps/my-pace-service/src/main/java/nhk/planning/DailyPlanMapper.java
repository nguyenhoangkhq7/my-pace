package nhk.planning;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import nhk.task.TaskMapper;

@Mapper(componentModel = "spring", uses = {TaskMapper.class}, unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface DailyPlanMapper {
    DailyPlanDto toDto(DailyPlan plan);
    DailyPlanTaskDto toDto(DailyPlanTask task);
}
