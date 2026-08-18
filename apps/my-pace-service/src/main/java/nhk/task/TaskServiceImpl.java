package nhk.task;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nhk.common.UserNotFoundException;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import nhk.scheduling.event.TaskMutatedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {
    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final GoalRepository goalRepository;
    private final nhk.goal.GoalService goalService;
    private final UserRepository userRepository;
    private final nhk.planning.DailyPlanTaskRepository dailyPlanTaskRepository;
    private final nhk.timeblock.TaskTimeBlockRepository timeBlockRepository;
    private final nhk.category.CategoryRepository categoryRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional(readOnly = true)
    public List<TaskDto> getTasks(UUID userId) {
        return taskRepository.findByUserId(userId)
                .stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
    }

    private Goal validateGoal(UUID goalId, UUID userId) {
        if (goalId != null) {
            Goal goal = goalRepository.findById(goalId)
                    .filter(g -> g.getUserId().equals(userId))
                    .orElseThrow(() -> new EntityNotFoundException("Goal not found"));
            if (!"In Progress".equals(goal.getStatus())) {
                throw new IllegalArgumentException("Chỉ có thể liên kết Task với Goal đang ở trạng thái In Progress.");
            }
            return goal;
        }
        return null;
    }

    private void validateSplittable(Boolean isSplittable, Integer estimatedMinutes, Integer minChunkMinutes, Integer maxDailyDuration) {
        if (Boolean.TRUE.equals(isSplittable)) {
            if (estimatedMinutes == null || estimatedMinutes < 15) {
                throw new IllegalArgumentException("Thời gian ước tính phải từ 15 phút trở lên mới có thể chia nhỏ.");
            }
            if (minChunkMinutes != null) {
                if (minChunkMinutes < 15) {
                    throw new IllegalArgumentException("Thời lượng 1 block tối thiểu phải từ 15 phút.");
                }
                if (minChunkMinutes > estimatedMinutes) {
                    throw new IllegalArgumentException(String.format("Thời lượng 1 block (%dm) không được lớn hơn tổng thời gian công việc (%dm).", minChunkMinutes, estimatedMinutes));
                }
                if (maxDailyDuration != null) {
                    if (maxDailyDuration > 720) {
                        throw new IllegalArgumentException("Thời lượng tối đa 1 ngày không được vượt quá 12 tiếng (720 phút).");
                    }
                    if (maxDailyDuration < minChunkMinutes) {
                        throw new IllegalArgumentException(String.format("Thời lượng tối đa 1 ngày (%dm) không được nhỏ hơn thời lượng 1 block (%dm).", maxDailyDuration, minChunkMinutes));
                    }
                }
            }
        }
    }

    @Override
    @Transactional
    public TaskDto createTask(TaskCreateRequest request, UUID userId) {
        validateSplittable(request.isSplittable(), request.estimatedMinutes(), request.minChunkMinutes(), request.maxDailyDuration());
        Goal goal = validateGoal(request.goalId(), userId);
        
        Task task = taskMapper.toEntity(request);
        task.setUserId(userId);
        if (goal != null) {
            task.setCategoryId(goal.getCategoryId());
            if (goal.getCategoryId() != null) {
                categoryRepository.findById(goal.getCategoryId()).ifPresent(task::setCategory);
            }
        } else if (task.getCategoryId() != null) {
            categoryRepository.findById(task.getCategoryId()).ifPresent(task::setCategory);
        }
        
        if (task.getIsUrgent() == null) {
            task.setIsUrgent(false);
        }
        if (task.getIsImportant() == null) {
            task.setIsImportant(false);
        }
        if (task.getIsSplittable() == null) {
            task.setIsSplittable(false);
        }
        if (request.status() != null && !request.status().trim().isEmpty()) {
            task.setStatus(request.status());
        } else {
            task.setStatus("Backlog");
        }
        
        Task saved = taskRepository.save(task);
        
        if (request.checklists() != null && !request.checklists().isEmpty()) {
            for (TaskChecklistItemRequest itemReq : request.checklists()) {
                if (itemReq.title() != null && !itemReq.title().trim().isEmpty()) {
                    TaskChecklistItem item = new TaskChecklistItem();
                    item.setTaskId(saved.getId());
                    item.setTask(saved);
                    item.setTitle(itemReq.title());
                    item.setIsCompleted(itemReq.isCompleted() != null ? itemReq.isCompleted() : false);
                    item.setOrderIndex(itemReq.orderIndex() != null ? itemReq.orderIndex() : saved.getChecklists().size());
                    saved.getChecklists().add(item);
                }
            }
            saved = taskRepository.save(saved);
        }

        if (saved.getGoalId() != null) {
            goalService.updateGoalProgress(saved.getGoalId());
        }
        eventPublisher.publishEvent(new TaskMutatedEvent(userId, saved.getId(), java.time.LocalDate.now()));
        return taskMapper.toDto(saved);
    }

    @Override
    @Transactional
    public TaskDto updateTask(UUID taskId, TaskUpdateRequest request, UUID userId) {
        if (request.title() != null && request.title().trim().isEmpty()) {
            throw new IllegalArgumentException("Title cannot be blank");
        }

        Goal goal = null;
        if (request.goalId() != null) {
            goal = validateGoal(request.goalId(), userId);
        }

        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));

        boolean wasDone = "Done".equals(task.getStatus());
        int oldActualMinutes = task.getActualMinutes() != null ? task.getActualMinutes() : 0;
        
        taskMapper.updateFromRequest(request, task);
        validateSplittable(task.getIsSplittable(), task.getEstimatedMinutes(), task.getMinChunkMinutes(), task.getMaxDailyDuration());
        
        if (Boolean.TRUE.equals(request.clearDueDate())) {
            task.setDueDate(null);
        }
        if (Boolean.TRUE.equals(request.clearGoalId())) {
            task.setGoalId(null);
        }
        if (Boolean.TRUE.equals(request.clearCategoryId())) {
            task.setCategoryId(null);
            task.setCategory(null);
        }

        if (task.getGoalId() != null) {
            if (goal == null) {
                goal = goalRepository.findById(task.getGoalId())
                        .filter(g -> g.getUserId().equals(userId))
                        .orElse(null);
            }
            if (goal != null) {
                task.setCategoryId(goal.getCategoryId());
                if (goal.getCategoryId() != null) {
                    categoryRepository.findById(goal.getCategoryId()).ifPresent(task::setCategory);
                } else {
                    task.setCategory(null);
                }
            }
        } else if (task.getCategoryId() != null) {
            categoryRepository.findById(task.getCategoryId()).ifPresent(task::setCategory);
        }
        // Update checklists manually if present in the request
        if (request.checklists() != null) {
            java.util.Map<UUID, TaskChecklistItem> existingItems = task.getChecklists().stream()
                    .filter(c -> c.getId() != null)
                    .collect(java.util.stream.Collectors.toMap(TaskChecklistItem::getId, c -> c));

            java.util.List<TaskChecklistItem> updatedChecklists = new java.util.ArrayList<>();
            for (int i = 0; i < request.checklists().size(); i++) {
                TaskChecklistItemRequest itemReq = request.checklists().get(i);
                if (itemReq.title() == null || itemReq.title().trim().isEmpty()) {
                    continue;
                }

                TaskChecklistItem item;
                if (itemReq.id() != null && existingItems.containsKey(itemReq.id())) {
                    item = existingItems.get(itemReq.id());
                    item.setTitle(itemReq.title());
                    item.setIsCompleted(itemReq.isCompleted() != null ? itemReq.isCompleted() : false);
                    item.setOrderIndex(itemReq.orderIndex() != null ? itemReq.orderIndex() : i);
                } else {
                    item = new TaskChecklistItem();
                    item.setTaskId(task.getId());
                    item.setTask(task);
                    item.setTitle(itemReq.title());
                    item.setIsCompleted(itemReq.isCompleted() != null ? itemReq.isCompleted() : false);
                    item.setOrderIndex(itemReq.orderIndex() != null ? itemReq.orderIndex() : i);
                }
                updatedChecklists.add(item);
            }

            task.getChecklists().clear();
            task.getChecklists().addAll(updatedChecklists);
        }

        boolean isNowDone = "Done".equals(task.getStatus());
        if (!wasDone && isNowDone) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new UserNotFoundException("User not found"));
            String tz = user.getTimezone();
            ZoneId zoneId = ZoneId.of(tz != null && !tz.isBlank() ? tz : "UTC");
            task.setDoneAt(OffsetDateTime.now(zoneId));
        } else if (wasDone && !isNowDone) {
            task.setDoneAt(null);
        }
        
        int newActualMinutes = task.getActualMinutes() != null ? task.getActualMinutes() : 0;

        Task saved = taskRepository.save(task);

        if (task.getGoalId() != null) {
            if (!wasDone && isNowDone) {
                goalService.updateGoalProgress(task.getGoalId());
            } else if (wasDone && !isNowDone) {
                goalService.updateGoalProgress(task.getGoalId());
            } else if (wasDone && isNowDone && oldActualMinutes != newActualMinutes) {
                goalService.updateGoalProgress(task.getGoalId());
            }
        }

        return taskMapper.toDto(saved);
    }
    
    @Override
    @Transactional
    public void deleteTask(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));
        UUID goalId = task.getGoalId();
        dailyPlanTaskRepository.deleteByTaskId(taskId);
        timeBlockRepository.deleteByTaskId(taskId);
        taskRepository.delete(task);
        eventPublisher.publishEvent(new TaskMutatedEvent(userId, taskId, java.time.LocalDate.now()));
        if (goalId != null) {
            goalService.updateGoalProgress(goalId);
        }
    }

    private Task getTaskByUserId(UUID taskId, UUID userId) {
        return taskRepository.findById(taskId)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));
    }

    @Override
    @Transactional
    public TaskChecklistItemDto addChecklistItem(UUID taskId, TaskChecklistItemRequest request, UUID userId) {
        Task task = getTaskByUserId(taskId, userId);
        
        TaskChecklistItem item = new TaskChecklistItem();
        item.setTaskId(task.getId());
        item.setTask(task);
        item.setTitle(request.title());
        item.setIsCompleted(request.isCompleted() != null ? request.isCompleted() : false);
        item.setOrderIndex(request.orderIndex() != null ? request.orderIndex() : task.getChecklists().size());
        
        task.getChecklists().add(item);
        taskRepository.save(task); // cascade will save item
        
        // Find the saved item to return
        TaskChecklistItem savedItem = task.getChecklists().get(task.getChecklists().size() - 1);
        return mapToChecklistItemDto(savedItem);
    }

    @Override
    @Transactional
    public TaskChecklistItemDto updateChecklistItem(UUID taskId, UUID checklistId, TaskChecklistItemRequest request, UUID userId) {
        Task task = getTaskByUserId(taskId, userId);
        
        TaskChecklistItem item = task.getChecklists().stream()
                .filter(c -> c.getId().equals(checklistId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Checklist item not found"));
                
        if (request.title() != null) {
            item.setTitle(request.title());
        }
        if (request.isCompleted() != null) {
            item.setIsCompleted(request.isCompleted());
        }
        if (request.orderIndex() != null) {
            item.setOrderIndex(request.orderIndex());
        }
        
        taskRepository.save(task);
        return mapToChecklistItemDto(item);
    }

    @Override
    @Transactional
    public void deleteChecklistItem(UUID taskId, UUID checklistId, UUID userId) {
        Task task = getTaskByUserId(taskId, userId);
        boolean removed = task.getChecklists().removeIf(c -> c.getId().equals(checklistId));
        if (removed) {
            taskRepository.save(task);
        }
    }

    @Override
    @Transactional
    public void reorderChecklists(UUID taskId, List<UUID> checklistIds, UUID userId) {
        Task task = getTaskByUserId(taskId, userId);
        for (int i = 0; i < checklistIds.size(); i++) {
            UUID id = checklistIds.get(i);
            final int index = i;
            task.getChecklists().stream()
                    .filter(c -> c.getId().equals(id))
                    .findFirst()
                    .ifPresent(c -> c.setOrderIndex(index));
        }
        taskRepository.save(task);
    }

    private TaskChecklistItemDto mapToChecklistItemDto(TaskChecklistItem item) {
        return new TaskChecklistItemDto(
            item.getId(),
            item.getTaskId(),
            item.getTitle(),
            item.getIsCompleted(),
            item.getOrderIndex(),
            item.getCreatedAt(),
            item.getUpdatedAt()
        );
    }
}
