package nhk.task;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {
    private final TaskService taskService;

    @GetMapping
    public List<TaskDto> getTasks(@AuthenticationPrincipal UserDetailsCustom userDetails) {
        return taskService.getTasks(userDetails);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDto createTask(@Valid @RequestBody TaskCreateRequest request,
                              @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return taskService.createTask(request, userDetails);
    }

    @PutMapping("/{taskId}")
    public TaskDto updateTask(@PathVariable UUID taskId,
                              @RequestBody TaskUpdateRequest request,
                              @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return taskService.updateTask(taskId, request, userDetails);
    }

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable UUID taskId,
                           @AuthenticationPrincipal UserDetailsCustom userDetails) {
        taskService.deleteTask(taskId, userDetails);
    }

    @PostMapping("/{taskId}/checklists")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskChecklistItemDto addChecklistItem(@PathVariable UUID taskId,
                                                 @Valid @RequestBody TaskChecklistItemRequest request,
                                                 @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return taskService.addChecklistItem(taskId, request, userDetails);
    }

    @PutMapping("/{taskId}/checklists/{checklistId}")
    public TaskChecklistItemDto updateChecklistItem(@PathVariable UUID taskId,
                                                    @PathVariable UUID checklistId,
                                                    @RequestBody TaskChecklistItemRequest request,
                                                    @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return taskService.updateChecklistItem(taskId, checklistId, request, userDetails);
    }

    @DeleteMapping("/{taskId}/checklists/{checklistId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteChecklistItem(@PathVariable UUID taskId,
                                    @PathVariable UUID checklistId,
                                    @AuthenticationPrincipal UserDetailsCustom userDetails) {
        taskService.deleteChecklistItem(taskId, checklistId, userDetails);
    }
}
