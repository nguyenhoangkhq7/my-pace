package nhk.goal;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import nhk.user.UserDetailsCustom;
import nhk.task.TaskRepository;
import nhk.category.CategoryRepository;
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
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<GoalDto> getGoals(UserDetailsCustom userDetails) {
        return goalRepository.findByUserId(userDetails.user().getId())
                .stream()
                .map(goalMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public GoalDto createGoal(GoalCreateRequest request, UserDetailsCustom userDetails) {
        if (request.getCategoryId() == null || !categoryRepository.existsById(request.getCategoryId())) {
            throw new IllegalArgumentException("Invalid category ID");
        }

        Goal goal = goalMapper.toEntity(request);
        goal.setUserId(userDetails.user().getId());
        goal.setStatus("In Progress");
        goal.setProgressPct(0);

        Goal saved = goalRepository.save(goal);
        
        recalculateBinaryGoalProgress(saved.getId());
        
        return goalMapper.toDto(saved);
    }

    @Transactional
    public GoalDto updateGoal(UUID goalId, GoalUpdateRequest request, UserDetailsCustom userDetails) {
        Goal goal = goalRepository.findById(goalId)
                .filter(g -> g.getUserId().equals(userDetails.user().getId()))
                .orElseThrow(() -> new EntityNotFoundException("Goal not found"));

        if (request.getCategoryId() != null && !categoryRepository.existsById(request.getCategoryId())) {
            throw new IllegalArgumentException("Invalid category ID");
        }

        boolean wantsToActivate = "In Progress".equals(request.getStatus()) && !"In Progress".equals(goal.getStatus());
        if (wantsToActivate) {
            int activeCount = goalRepository.countByUserIdAndStatus(userDetails.user().getId(), "In Progress");
            if (activeCount >= 5) {
                throw new GoalLimitExceededException("Bạn chỉ được phép có tối đa 5 Goal đang In Progress.");
            }
        }

        goalMapper.updateFromRequest(request, goal);

        Goal saved = goalRepository.save(goal);
        
        recalculateBinaryGoalProgress(saved.getId());
        
        return goalMapper.toDto(saved);
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

    @Transactional
    public void updateGoalProgress(UUID goalId) {
        if (goalId == null) return;

        Goal goal = goalRepository.findById(goalId).orElse(null);
        if (goal == null) return;

        if ("Binary".equals(goal.getGoalType())) {
            recalculateBinaryGoalProgress(goal.getId());
        } else {
            if (goal.getProgressPct() >= 100) {
                goal.setStatus("Done");
            }
            goalRepository.save(goal);
        }
    }

    private void recalculateBinaryGoalProgress(UUID goalId) {
        Goal goal = goalRepository.findById(goalId).orElse(null);
        if (goal == null || !"Binary".equals(goal.getGoalType())) return;

        long totalTasks = taskRepository.countByGoalId(goalId);
        
        if (totalTasks == 0) {
            goal.setProgressPct(0);
        } else {
            long doneTasks = taskRepository.countByGoalIdAndStatus(goalId, "Done");
            
            goal.setProgressPct((int) ((double) doneTasks / totalTasks * 100));
            if (goal.getProgressPct() >= 100) {
                goal.setStatus("Done");
            } else if ("Done".equals(goal.getStatus())) {
                goal.setStatus("In Progress");
            }
        }
        goalRepository.save(goal);
    }
}
