package nhk.goal;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import nhk.user.UserDetailsCustom;
import nhk.task.TaskRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
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
                .map(goal -> {
                    GoalDto dto = goalMapper.toDto(goal);
                    calculateProgress(goal, dto);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private void calculateProgress(Goal goal, GoalDto dto) {
        if ("Binary".equals(goal.getGoalType())) {
            dto.setTargetValue(1);
            if ("Done".equals(goal.getStatus())) {
                dto.setCurrentValue(1);
                dto.setProgressPercentage(100.0);
            } else {
                dto.setCurrentValue(0);
                dto.setProgressPercentage(0.0);
            }
        } else if ("Milestone".equals(goal.getGoalType())) {
            if (goal.getMilestones() == null || goal.getMilestones().isEmpty()) {
                dto.setTargetValue(0);
                dto.setCurrentValue(0);
                dto.setProgressPercentage(0.0);
            } else {
                int target = goal.getMilestones().size();
                long current = goal.getMilestones().stream().filter(Milestone::getIsDone).count();
                dto.setTargetValue(target);
                dto.setCurrentValue((int) current);
                dto.setProgressPercentage((double) current / target * 100.0);
            }
        } else if ("Time-boxed".equals(goal.getGoalType())) {
            int current = taskRepository.sumActualMinutesByGoalId(goal.getId());
            int target = 0;

            if (goal.getTimeBoxedGoal() != null) {
                int periodDays = goal.getTimeBoxedGoal().getPeriodDays() > 0 ? goal.getTimeBoxedGoal().getPeriodDays() : 1;
                int targetMinutes = goal.getTimeBoxedGoal().getTargetMinutes();
                
                long totalDays = periodDays;
                if (goal.getStartDate() != null && goal.getEndDate() != null) {
                    totalDays = ChronoUnit.DAYS.between(goal.getStartDate(), goal.getEndDate()) + 1;
                    if (totalDays <= 0) totalDays = periodDays;
                }
                target = (int) ((totalDays / (double) periodDays) * targetMinutes);
            }

            dto.setCurrentValue(current);
            dto.setTargetValue(target);
            if (target > 0) {
                double pct = (double) current / target * 100.0;
                dto.setProgressPercentage(Math.min(pct, 100.0)); // Cap at 100% just in case
            } else {
                dto.setProgressPercentage(0.0);
            }
        }
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
        GoalDto dto = goalMapper.toDto(saved);
        calculateProgress(saved, dto);
        return dto;
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

        Goal saved = goalRepository.save(goal);
        GoalDto dto = goalMapper.toDto(saved);
        calculateProgress(saved, dto);
        return dto;
    }

    @Transactional
    public GoalDto updateMilestone(UUID goalId, UUID milestoneId, boolean isDone, UserDetailsCustom userDetails) {
        Goal goal = goalRepository.findById(goalId)
                .filter(g -> g.getUserId().equals(userDetails.user().getId()))
                .orElseThrow(() -> new EntityNotFoundException("Goal not found"));

        if (goal.getMilestones() != null) {
            goal.getMilestones().stream()
                .filter(m -> m.getId().equals(milestoneId))
                .findFirst()
                .ifPresent(m -> {
                    m.setIsDone(isDone);
                    m.setDoneAt(isDone ? OffsetDateTime.now() : null);
                });
        }

        Goal saved = goalRepository.save(goal);
        GoalDto dto = goalMapper.toDto(saved);
        calculateProgress(saved, dto);
        return dto;
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
