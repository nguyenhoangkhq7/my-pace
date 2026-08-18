package nhk.goal;

import lombok.RequiredArgsConstructor;
import nhk.category.CategoryRepository;
import nhk.common.GoalNotFoundException;
import nhk.task.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoalServiceImpl implements GoalService {
    private final GoalRepository goalRepository;
    private final GoalMapper goalMapper;
    private final TaskRepository taskRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<GoalDto> getGoals(UUID userId) {
        return goalRepository.findByUserId(userId)
                .stream()
                .map(goalMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public GoalDto createGoal(GoalCreateRequest request, UUID userId) {
        if (request.categoryId() == null || !categoryRepository.existsById(request.categoryId())) {
            throw new IllegalArgumentException("Invalid category ID");
        }

        Goal goal = goalMapper.toEntity(request);
        goal.setUserId(userId);
        goal.setStatus("In Progress");
        goal.setProgressPct(0);

        Goal saved = goalRepository.save(goal);
        
        recalculateBinaryGoalProgress(saved.getId());
        
        return goalMapper.toDto(saved);
    }

    @Override
    @Transactional
    public GoalDto updateGoal(UUID goalId, GoalUpdateRequest request, UUID userId) {
        Goal goal = goalRepository.findById(goalId)
                .filter(g -> g.getUserId().equals(userId))
                .orElseThrow(() -> new GoalNotFoundException("Goal not found"));

        if (request.categoryId() != null && !categoryRepository.existsById(request.categoryId())) {
            throw new IllegalArgumentException("Invalid category ID");
        }

        boolean wantsToActivate = "In Progress".equals(request.status()) && !"In Progress".equals(goal.getStatus());
        if (wantsToActivate) {
            int activeCount = goalRepository.countByUserIdAndStatus(userId, "In Progress");
            if (activeCount >= 5) {
                throw new GoalLimitExceededException("Bạn chỉ được phép có tối đa 5 Goal đang In Progress.");
            }
        }

        UUID oldCategoryId = goal.getCategoryId();
        goalMapper.updateFromRequest(request, goal);

        Goal saved = goalRepository.save(goal);
        
        if (saved.getCategoryId() != null && !saved.getCategoryId().equals(oldCategoryId)) {
            taskRepository.updateCategoryIdByGoalId(saved.getId(), saved.getCategoryId());
        }
        
        recalculateBinaryGoalProgress(saved.getId());
        
        return goalMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteGoal(UUID goalId, UUID userId) {
        Goal goal = goalRepository.findById(goalId)
                .filter(g -> g.getUserId().equals(userId))
                .orElseThrow(() -> new GoalNotFoundException("Goal not found"));

        if (taskRepository.existsByGoalId(goal.getId())) {
            goal.setStatus("Archived");
            goalRepository.save(goal);
        } else {
            goalRepository.delete(goal);
        }
    }

    @Override
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
