package nhk.kanban.controller;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import nhk.kanban.dto.CreateTaskRequest;
import nhk.kanban.service.TaskService;
import nhk.kanban.dto.TaskSimpleResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@RestController
@RequestMapping("/api/tasks")
class TaskController {
   private final TaskService taskService;

   @PostMapping
   public ResponseEntity<TaskSimpleResponse> createMyTask(
           @Valid @RequestBody CreateTaskRequest request,
           @AuthenticationPrincipal Integer userId
   ) {
      var createdTask = taskService.createMyTask(request, userId);
      return ResponseEntity.status(HttpStatus.CREATED).body(createdTask);
   }
}


