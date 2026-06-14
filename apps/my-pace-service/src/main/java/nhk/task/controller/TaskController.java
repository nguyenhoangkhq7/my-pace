package nhk.task.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nhk.common.ApiResponse;
import nhk.task.dto.request.TaskCreateRequest;
import nhk.task.dto.request.TaskUpdateRequest;
import nhk.task.dto.response.TaskResponse;
import nhk.task.dto.response.TodayStatsResponse;
import nhk.task.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {
    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasks(@RequestParam(required = false) Integer categoryId) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.getTasks(categoryId)));
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTask(@PathVariable Integer taskId) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.getTask(taskId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(@Valid @RequestBody TaskCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(taskService.createTask(request), 201, "Task created successfully"));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable Integer taskId,
            @RequestBody TaskUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.updateTask(taskId, request), "Task updated successfully"));
    }

    @PatchMapping("/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> patchTask(
            @PathVariable Integer taskId,
            @RequestBody TaskUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.patchTask(taskId, request), "Task updated successfully"));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Integer taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Task deleted successfully"));
    }

    @GetMapping("/matrix")
    public ResponseEntity<ApiResponse<Map<String, List<TaskResponse>>>> getMatrix() {
        return ResponseEntity.ok(ApiResponse.ok(taskService.getTaskMatrix()));
    }

    @GetMapping("/today-stats")
    public ResponseEntity<ApiResponse<TodayStatsResponse>> getTodayStats() {
        return ResponseEntity.ok(ApiResponse.ok(taskService.getTodayStats()));
    }
}

