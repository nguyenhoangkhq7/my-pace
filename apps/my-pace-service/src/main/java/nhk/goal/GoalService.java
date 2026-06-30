package nhk.goal;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import nhk.user.UserDetailsCustom;
import nhk.task.TaskRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoalService {
    private final GoalRepository goalRepository;
    private final GoalMapper goalMapper;
    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public List<GoalDto> getGoals(UserDetailsCustom userDetails) {
        return goalRepository.findByUserId(userDetails.user().getId())
                .stream()
                .map(goalMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public GoalDto createGoal(GoalCreateRequest request, UserDetailsCustom userDetails) {
        Goal goal = goalMapper.toEntity(request);
        goal.setUserId(userDetails.user().getId());
        goal.setStatus("Freeze");

        if (goal.getTimeBoxedGoal() != null) {
            goal.getTimeBoxedGoal().setGoal(goal);
        }
        if (goal.getMilestones() != null) {
            goal.getMilestones().forEach(m -> m.setGoal(goal));
        }

        Goal saved = goalRepository.save(goal);
        return goalMapper.toDto(saved);
    }

    @Transactional
    public GoalDto updateGoal(UUID goalId, GoalUpdateRequest request, UserDetailsCustom userDetails) {
        Goal goal = goalRepository.findById(goalId)
                .filter(g -> g.getUserId().equals(userDetails.user().getId()))
                .orElseThrow(() -> new EntityNotFoundException("Goal not found"));

        boolean wantsToActivate = "In Progress".equals(request.getStatus()) && !"In Progress".equals(goal.getStatus());
        if (wantsToActivate) {
            int activeCount = goalRepository.countByUserIdAndStatus(userDetails.user().getId(), "In Progress");
            if (activeCount >= 5) {
                throw new GoalLimitExceededException("Bạn chỉ được phép có tối đa 5 Goal đang In Progress.");
            }
        }

        goalMapper.updateFromRequest(request, goal);

        if (goal.getTimeBoxedGoal() != null) {
            goal.getTimeBoxedGoal().setGoal(goal);
        }
        if (goal.getMilestones() != null) {
            goal.getMilestones().forEach(m -> m.setGoal(goal));
        }

        return goalMapper.toDto(goalRepository.save(goal));
    }

    @Transactional
    public void deleteGoal(UUID goalId, UserDetailsCustom userDetails) {
        Goal goal = goalRepository.findById(goalId)
                .filter(g -> g.getUserId().equals(userDetails.user().getId()))
                .orElseThrow(() -> new EntityNotFoundException("Goal not found"));

        if (taskRepository.existsByGoalId(goal.getId())) {
            goal.setStatus("Archived");
            goalRepository.save(goal);
        } else {
            goalRepository.delete(goal);
        }
    }
}
