package nhk.task.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nhk.common.ApiResponse;
import nhk.task.dto.request.AutoScheduleRequest;
import nhk.task.dto.request.ScheduledTaskRequest;
import nhk.task.dto.request.ScheduledTaskUpdateRequest;
import nhk.task.dto.response.ScheduledTaskResponse;
import nhk.task.service.ScheduledTaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/scheduled-tasks")
@RequiredArgsConstructor
public class ScheduledTaskController {
    private final ScheduledTaskService scheduledTaskService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ScheduledTaskResponse>>> getScheduledTasks() {
        return ResponseEntity.ok(ApiResponse.ok(scheduledTaskService.getScheduledTasks()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ScheduledTaskResponse>> getScheduledTask(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(scheduledTaskService.getScheduledTask(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ScheduledTaskResponse>> scheduleTask(@Valid @RequestBody ScheduledTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(scheduledTaskService.scheduleTask(request), "Task scheduled successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ScheduledTaskResponse>> updateScheduledTask(
            @PathVariable Integer id,
            @Valid @RequestBody ScheduledTaskUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(scheduledTaskService.updateScheduledTask(id, request), "Schedule updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> unscheduleTask(@PathVariable Integer id) {
        scheduledTaskService.unscheduleTask(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Task unscheduled successfully"));
    }

    @PostMapping("/auto-schedule")
    public ResponseEntity<ApiResponse<ScheduledTaskResponse>> autoSchedule(@Valid @RequestBody AutoScheduleRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(scheduledTaskService.autoSchedule(request), "Task auto-scheduled successfully"));
    }
}


