package nhk.task.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nhk.auth.SecurityUtils;
import nhk.task.dto.request.TaskCreateRequest;
import nhk.task.dto.request.TaskUpdateRequest;
import nhk.task.dto.response.TaskResponse;
import nhk.task.dto.response.TodayStatsResponse;
import nhk.task.entity.Task;
import nhk.task.entity.TaskDetail;
import nhk.task.entity.TaskStatus;
import nhk.task.mapper.TaskMapper;
import nhk.task.repository.CategoryRepository;
import nhk.task.repository.TaskRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TaskMapper taskMapper;

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(Integer categoryId) {
        User currentUser = getCurrentUser();
        List<Task> tasks = categoryId == null
                ? taskRepository.findAllByUserIdOrderByCreatedAtDesc(currentUser.getId())
                : taskRepository.findAllByUserIdAndCategoryIdOrderByCreatedAtDesc(currentUser.getId(), categoryId);
        return tasks.stream().map(taskMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getTask(Integer taskId) {
        User currentUser = getCurrentUser();
        Task task = taskRepository.findByIdAndUserId(taskId, currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + taskId));
        return taskMapper.toResponse(task);
    }

    @Transactional
    public TaskResponse createTask(TaskCreateRequest request) {
        User currentUser = getCurrentUser();
        Task task = taskMapper.toEntity(request);
        task.setUser(userRepository.getReferenceById(currentUser.getId()));
        task.setCreatedAt(LocalDateTime.now());
        applyAssociations(task, currentUser.getId(), request.getCategoryId(), request.getParentId());
        upsertDetail(task, request.getDescription(), request.getAttachmentsJson());
        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(Integer taskId, TaskUpdateRequest request) {
        User currentUser = getCurrentUser();
        Task task = taskRepository.findByIdAndUserId(taskId, currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + taskId));

        applyTaskUpdate(task, currentUser.getId(), request);
        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse patchTask(Integer taskId, TaskUpdateRequest request) {
        return updateTask(taskId, request);
    }

    @Transactional
    public void deleteTask(Integer taskId) {
        User currentUser = getCurrentUser();
        Task task = taskRepository.findByIdAndUserId(taskId, currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("Task not found with id: " + taskId));
        taskRepository.delete(task);
    }

    @Transactional(readOnly = true)
    public Map<String, List<TaskResponse>> getTaskMatrix() {
        User currentUser = getCurrentUser();
        List<Task> tasks = taskRepository.findAllByUserIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .filter(task -> !isCompleted(task))
                .toList();

        Map<String, List<TaskResponse>> matrix = new LinkedHashMap<>();
        matrix.put("do-now", tasks.stream().filter(this::isDoNow).map(taskMapper::toResponse).toList());
        matrix.put("schedule", tasks.stream().filter(this::isSchedule).map(taskMapper::toResponse).toList());
        matrix.put("delegate", tasks.stream().filter(this::isDelegate).map(taskMapper::toResponse).toList());
        matrix.put("eliminate", tasks.stream().filter(this::isEliminate).map(taskMapper::toResponse).toList());
        return matrix;
    }

    @Transactional(readOnly = true)
    public TodayStatsResponse getTodayStats() {
        User currentUser = getCurrentUser();
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        List<Task> tasks = taskRepository.findAllByUserIdOrderByCreatedAtDesc(currentUser.getId());
        long total = tasks.stream()
                .filter(task -> task.getDueDate() != null && task.getDueDate().toLocalDate().equals(today))
                .count();
        long completed = tasks.stream()
                .filter(task -> task.getDueDate() != null && task.getDueDate().toLocalDate().equals(today))
                .filter(this::isCompleted)
                .count();
        long overdue = tasks.stream()
                .filter(task -> task.getDueDate() != null && task.getDueDate().toLocalDate().equals(today))
                .filter(task -> !isCompleted(task))
                .filter(task -> task.getDueDate().isBefore(now))
                .count();

        return new TodayStatsResponse(total, completed, overdue);
    }

    private void applyAssociations(Task task, Integer userId, Integer categoryId, Integer parentId) {
        if (categoryId != null) {
            task.setCategory(categoryRepository.findByIdAndUser_Id(categoryId, userId)
                    .orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + categoryId)));
        }

        if (parentId != null) {
            task.setParent(taskRepository.findByIdAndUserId(parentId, userId)
                    .orElseThrow(() -> new EntityNotFoundException("Parent task not found with id: " + parentId)));
        }
    }

    private void applyTaskUpdate(Task task, Integer userId, TaskUpdateRequest request) {
        taskMapper.updateEntity(request, task);
        applyAssociations(task, userId, request.getCategoryId(), request.getParentId());
        upsertDetail(task, request.getDescription(), request.getAttachmentsJson());
    }

    private boolean isCompleted(Task task) {
        return Boolean.TRUE.equals(task.getIsDone()) || task.getStatus() == TaskStatus.DONE;
    }

    private boolean isImportant(Task task) {
        return Boolean.TRUE.equals(task.getIsImportant());
    }

    private boolean isDueTodayOrPast(Task task) {
        return task.getDueDate() != null && !task.getDueDate().isAfter(LocalDateTime.now());
    }

    private boolean isFutureOrNull(Task task) {
        return task.getDueDate() == null || task.getDueDate().isAfter(LocalDateTime.now());
    }

    private boolean isDoNow(Task task) {
        return isImportant(task) && isDueTodayOrPast(task);
    }

    private boolean isSchedule(Task task) {
        return isImportant(task) && isFutureOrNull(task);
    }

    private boolean isDelegate(Task task) {
        return !isImportant(task) && isDueTodayOrPast(task);
    }

    private boolean isEliminate(Task task) {
        return !isImportant(task) && isFutureOrNull(task);
    }

    private void upsertDetail(Task task, String description, String attachmentsJson) {
        boolean hasDetailData = description != null || attachmentsJson != null;
        if (!hasDetailData && task.getDetail() == null) {
            return;
        }

        TaskDetail detail = task.getDetail();
        if (detail == null) {
            detail = new TaskDetail();
            detail.setTask(task);
            task.setDetail(detail);
        }

        if (description != null) {
            detail.setDescription(description);
        }
        if (attachmentsJson != null) {
            detail.setAttachmentsJson(attachmentsJson);
        }
        if (hasDetailData) {
            detail.setUpdatedAt(LocalDateTime.now());
        }
    }

    private User getCurrentUser() {
        return SecurityUtils.getCurrentUser()
                .orElseThrow(() -> new AccessDeniedException("Unable to resolve current user"));
    }
}

