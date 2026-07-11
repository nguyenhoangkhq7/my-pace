package nhk.task;

import lombok.RequiredArgsConstructor;
import jakarta.persistence.EntityNotFoundException;
import nhk.user.UserDetailsCustom;
import nhk.goal.GoalRepository;
import nhk.goal.Goal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final GoalRepository goalRepository;
    private final nhk.goal.GoalService goalService;

    @Transactional(readOnly = true)
    public List<TaskDto> getTasks(UserDetailsCustom userDetails) {
        return taskRepository.findByUserId(userDetails.user().getId())
                .stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
    }

    private void validateGoal(UUID goalId, UUID userId) {
        if (goalId != null) {
            Goal goal = goalRepository.findById(goalId)
                    .filter(g -> g.getUserId().equals(userId))
                    .orElseThrow(() -> new EntityNotFoundException("Goal not found"));
            if ("Freeze".equals(goal.getStatus()) || "Archived".equals(goal.getStatus())) {
                throw new IllegalArgumentException("Chỉ có thể liên kết Task với Goal đang In Progress hoặc Done.");
            }
        }
    }

    @Transactional
    public TaskDto createTask(TaskCreateRequest request, UserDetailsCustom userDetails) {
        validateGoal(request.getGoalId(), userDetails.user().getId());
        
        Task task = taskMapper.toEntity(request);
        task.setUserId(userDetails.user().getId());
        
        if (task.getIsUrgent() == null) {
            task.setIsUrgent(false);
        }
        if (task.getIsImportant() == null) {
            task.setIsImportant(false);
        }
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            task.setStatus(request.getStatus());
        } else {
            task.setStatus("Backlog");
        }
        
        Task saved = taskRepository.save(task);
        
        if (request.getChecklists() != null && !request.getChecklists().isEmpty()) {
            for (TaskChecklistItemRequest itemReq : request.getChecklists()) {
                if (itemReq.getTitle() != null && !itemReq.getTitle().trim().isEmpty()) {
                    TaskChecklistItem item = new TaskChecklistItem();
                    item.setTaskId(saved.getId());
                    item.setTask(saved);
                    item.setTitle(itemReq.getTitle());
                    item.setIsCompleted(itemReq.getIsCompleted() != null ? itemReq.getIsCompleted() : false);
                    saved.getChecklists().add(item);
                }
            }
            saved = taskRepository.save(saved);
        }

        if (saved.getGoalId() != null) {
            goalService.updateGoalProgress(saved.getGoalId(), 0, 0);
        }
        return taskMapper.toDto(saved);
    }

    @Transactional
    public TaskDto updateTask(UUID taskId, TaskUpdateRequest request, UserDetailsCustom userDetails) {
        if (request.getGoalId() != null) {
            validateGoal(request.getGoalId(), userDetails.user().getId());
        }

        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getUserId().equals(userDetails.user().getId()))
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));

        boolean wasDone = "Done".equals(task.getStatus());
        int oldActualMinutes = task.getActualMinutes() != null ? task.getActualMinutes() : 0;
        
        taskMapper.updateFromRequest(request, task);
        
        boolean isNowDone = "Done".equals(task.getStatus());
        if (!wasDone && isNowDone) {
            task.setDoneAt(java.time.OffsetDateTime.now());
        } else if (wasDone && !isNowDone) {
            task.setDoneAt(null);
        }
        
        int newActualMinutes = task.getActualMinutes() != null ? task.getActualMinutes() : 0;

        Task saved = taskRepository.save(task);

        if (task.getGoalId() != null) {
            if (!wasDone && isNowDone) {
                goalService.updateGoalProgress(task.getGoalId(), newActualMinutes, 1);
            } else if (wasDone && !isNowDone) {
                goalService.updateGoalProgress(task.getGoalId(), -oldActualMinutes, -1);
            } else if (wasDone && isNowDone && oldActualMinutes != newActualMinutes) {
                goalService.updateGoalProgress(task.getGoalId(), newActualMinutes - oldActualMinutes, 0);
            }
        }

        return taskMapper.toDto(saved);
    }
    
    @Transactional
    public void deleteTask(UUID taskId, UserDetailsCustom userDetails) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getUserId().equals(userDetails.user().getId()))
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));
        taskRepository.delete(task);
        if (task.getGoalId() != null) {
            goalService.updateGoalProgress(task.getGoalId(), 0, 0);
        }
    }

    private Task getTaskByUserId(UUID taskId, UUID userId) {
        return taskRepository.findById(taskId)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));
    }

    @Transactional
    public TaskChecklistItemDto addChecklistItem(UUID taskId, TaskChecklistItemRequest request, UserDetailsCustom userDetails) {
        Task task = getTaskByUserId(taskId, userDetails.user().getId());
        
        TaskChecklistItem item = new TaskChecklistItem();
        item.setTaskId(task.getId());
        item.setTask(task);
        item.setTitle(request.getTitle());
        item.setIsCompleted(request.getIsCompleted() != null ? request.getIsCompleted() : false);
        
        task.getChecklists().add(item);
        taskRepository.save(task); // cascade will save item
        
        // Find the saved item to return
        TaskChecklistItem savedItem = task.getChecklists().get(task.getChecklists().size() - 1);
        return mapToChecklistItemDto(savedItem);
    }

    @Transactional
    public TaskChecklistItemDto updateChecklistItem(UUID taskId, UUID checklistId, TaskChecklistItemRequest request, UserDetailsCustom userDetails) {
        Task task = getTaskByUserId(taskId, userDetails.user().getId());
        
        TaskChecklistItem item = task.getChecklists().stream()
                .filter(c -> c.getId().equals(checklistId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Checklist item not found"));
                
        if (request.getTitle() != null) {
            item.setTitle(request.getTitle());
        }
        if (request.getIsCompleted() != null) {
            item.setIsCompleted(request.getIsCompleted());
        }
        
        taskRepository.save(task);
        return mapToChecklistItemDto(item);
    }

    @Transactional
    public void deleteChecklistItem(UUID taskId, UUID checklistId, UserDetailsCustom userDetails) {
        Task task = getTaskByUserId(taskId, userDetails.user().getId());
        boolean removed = task.getChecklists().removeIf(c -> c.getId().equals(checklistId));
        if (removed) {
            taskRepository.save(task);
        }
    }

    private TaskChecklistItemDto mapToChecklistItemDto(TaskChecklistItem item) {
        TaskChecklistItemDto dto = new TaskChecklistItemDto();
        dto.setId(item.getId());
        dto.setTaskId(item.getTaskId());
        dto.setTitle(item.getTitle());
        dto.setIsCompleted(item.getIsCompleted());
        dto.setCreatedAt(item.getCreatedAt());
        dto.setUpdatedAt(item.getUpdatedAt());
        return dto;
    }
}
