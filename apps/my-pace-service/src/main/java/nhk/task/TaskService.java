package nhk.task;

import java.util.List;
import java.util.UUID;

public interface TaskService {
    List<TaskDto> getTasks(UUID userId);
    TaskDto createTask(TaskCreateRequest request, UUID userId);
    TaskDto updateTask(UUID taskId, TaskUpdateRequest request, UUID userId);
    void deleteTask(UUID taskId, UUID userId);
    TaskChecklistItemDto addChecklistItem(UUID taskId, TaskChecklistItemRequest request, UUID userId);
    TaskChecklistItemDto updateChecklistItem(UUID taskId, UUID checklistId, TaskChecklistItemRequest request, UUID userId);
    void deleteChecklistItem(UUID taskId, UUID checklistId, UUID userId);
    void reorderChecklists(UUID taskId, List<UUID> checklistIds, UUID userId);
}
