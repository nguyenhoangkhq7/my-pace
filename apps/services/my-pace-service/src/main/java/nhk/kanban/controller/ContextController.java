package nhk.kanban.controller;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import nhk.kanban.service.ContextService;
import nhk.kanban.dto.ContextSimpleResponse;
import nhk.kanban.dto.CreateContextRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@RestController
@RequestMapping("/api/contexts")
class ContextController {
   private final ContextService contextService;

   @PostMapping
   public ResponseEntity<ContextSimpleResponse> createMyContext(
           @Valid @RequestBody CreateContextRequest request,
           @AuthenticationPrincipal Integer userId
   ) {
      var createdContext = contextService.createMyContext(request, userId);
      return ResponseEntity.status(HttpStatus.CREATED).body(createdContext);
   }
}

