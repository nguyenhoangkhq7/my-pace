package nhk.goal;

import java.util.List;
import java.util.UUID;

public interface GoalService {
    List<GoalDto> getGoals(UUID userId);
    GoalDto createGoal(GoalCreateRequest request, UUID userId);
    GoalDto updateGoal(UUID goalId, GoalUpdateRequest request, UUID userId);
    void deleteGoal(UUID goalId, UUID userId);
    void updateGoalProgress(UUID goalId);
}
