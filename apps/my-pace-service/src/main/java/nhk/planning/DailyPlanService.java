package nhk.planning;

import java.time.LocalDate;
import java.util.UUID;

public interface DailyPlanService {
    DailyPlanDto getDailyPlan(LocalDate planDate, UUID userId);
    DailyPlanDto planMyDay(PlanMyDayRequest request, UUID userId);
    DailyPlanDto confirmPlan(LocalDate planDate, UUID userId);
    DailyPlanDto unconfirmPlan(LocalDate planDate, UUID userId);
    void cancelPlan(LocalDate planDate, UUID userId);
    void toggleTaskDone(UUID dailyPlanTaskId, UUID userId);
    DailyPlanDto reviewPlan(LocalDate planDate, UUID userId);
    DailyPlanDto getUnreviewedPlan(LocalDate today, UUID userId);
}
