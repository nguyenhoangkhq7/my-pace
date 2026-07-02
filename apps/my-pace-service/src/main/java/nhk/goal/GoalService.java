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
        goal.setStatus(goal.getParentGoalId() != null ? "In Progress" : "Freeze");
        goal.setProgressPct(0);

        if (goal.getTimeBoxedGoal() != null) {
            goal.getTimeBoxedGoal().setGoal(goal);
            goal.getTimeBoxedGoal().setAccumulatedMinutes(0);
        }
        if (goal.getMilestoneGoal() != null) {
            goal.getMilestoneGoal().setGoal(goal);
            goal.getMilestoneGoal().setCurrentCount(0);
        }

        Goal saved = goalRepository.save(goal);
        if (saved.getParentGoalId() != null) {
            recalculateBinaryGoalProgress(saved.getParentGoalId());
        }
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

        if (goal.getTimeBoxedGoal() != null) {
            goal.getTimeBoxedGoal().setGoal(goal);
        }
        if (goal.getMilestoneGoal() != null) {
            goal.getMilestoneGoal().setGoal(goal);
        }

        Goal saved = goalRepository.save(goal);
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
        
        if (goal.getParentGoalId() != null) {
            recalculateBinaryGoalProgress(goal.getParentGoalId());
        }
    }

    @Transactional
    public void updateGoalProgress(UUID goalId, int addedMinutes, int addedCount) {
        if (goalId == null) return;

        Goal goal = goalRepository.findById(goalId).orElse(null);
        if (goal == null) return;

        if ("Time-boxed".equals(goal.getGoalType()) && goal.getTimeBoxedGoal() != null) {
            TimeBoxedGoal tb = goal.getTimeBoxedGoal();
            tb.setAccumulatedMinutes(tb.getAccumulatedMinutes() + addedMinutes);
            int target = tb.getTargetMinutes() * Math.max(tb.getPeriodDays(), 1); // Simple target calculation
            if (target > 0) {
                double pct = (double) tb.getAccumulatedMinutes() / target * 100.0;
                goal.setProgressPct((int) Math.min(pct, 100.0));
            }
        } else if ("Milestone".equals(goal.getGoalType()) && goal.getMilestoneGoal() != null) {
            MilestoneGoal mg = goal.getMilestoneGoal();
            mg.setCurrentCount(mg.getCurrentCount() + addedCount);
            if (mg.getTargetCount() > 0) {
                double pct = (double) mg.getCurrentCount() / mg.getTargetCount() * 100.0;
                goal.setProgressPct((int) Math.min(pct, 100.0));
            }
        }

        if ("Binary".equals(goal.getGoalType())) {
            recalculateBinaryGoalProgress(goal.getId());
        } else {
            if (goal.getProgressPct() >= 100) {
                goal.setStatus("Done");
            }
            goalRepository.save(goal);
        }

        if (goal.getParentGoalId() != null) {
            recalculateBinaryGoalProgress(goal.getParentGoalId());
        }
    }

    private void recalculateBinaryGoalProgress(UUID parentGoalId) {
        Goal parent = goalRepository.findById(parentGoalId).orElse(null);
        if (parent == null || !"Binary".equals(parent.getGoalType())) return;

        long totalTasks = taskRepository.countByGoalId(parentGoalId);
        long totalSubgoals = goalRepository.countByParentGoalId(parentGoalId);
        long totalItems = totalTasks + totalSubgoals;
        
        if (totalItems == 0) {
            parent.setProgressPct(0);
        } else {
            long doneTasks = taskRepository.countByGoalIdAndStatus(parentGoalId, "Done");
            long doneSubgoals = goalRepository.countByParentGoalIdAndStatus(parentGoalId, "Done");
            long doneItems = doneTasks + doneSubgoals;
            
            parent.setProgressPct((int) ((double) doneItems / totalItems * 100));
            if (parent.getProgressPct() >= 100) {
                parent.setStatus("Done");
            } else if ("Done".equals(parent.getStatus())) {
                parent.setStatus("In Progress");
            }
        }
        goalRepository.save(parent);

        if (parent.getParentGoalId() != null) {
            recalculateBinaryGoalProgress(parent.getParentGoalId());
        }
    }
}
