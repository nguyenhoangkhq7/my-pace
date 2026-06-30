package nhk.task;

import lombok.RequiredArgsConstructor;
import jakarta.persistence.EntityNotFoundException;
import nhk.user.UserDetailsCustom;
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

    @Transactional(readOnly = true)
    public List<TaskDto> getTasks(UserDetailsCustom userDetails) {
        return taskRepository.findByUserId(userDetails.user().getId())
                .stream()
                .map(taskMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskDto createTask(TaskCreateRequest request, UserDetailsCustom userDetails) {
        Task task = taskMapper.toEntity(request);
        task.setUserId(userDetails.user().getId());
        

        if (task.getIsUrgent() == null) {
            task.setIsUrgent(false);
        }
        if (task.getIsImportant() == null) {
            task.setIsImportant(false);
        }
        task.setStatus("Backlog");
        
        Task saved = taskRepository.save(task);
        return taskMapper.toDto(saved);
    }

    @Transactional
    public TaskDto updateTask(UUID taskId, TaskUpdateRequest request, UserDetailsCustom userDetails) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getUserId().equals(userDetails.user().getId()))
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));

        taskMapper.updateFromRequest(request, task);
        return taskMapper.toDto(taskRepository.save(task));
    }
    
    @Transactional
    public void deleteTask(UUID taskId, UserDetailsCustom userDetails) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getUserId().equals(userDetails.user().getId()))
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));
        taskRepository.delete(task);
    }
}
