package nhk.kanban.controller;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import nhk.kanban.service.BoardColumnService;
import nhk.kanban.dto.BoardColumnSimpleResponse;
import nhk.kanban.dto.CreateBoardColumnRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@RestController
@RequestMapping("/api/board-columns")
class BoardColumnController {
   private final BoardColumnService boardColumnService;

   @PostMapping
   public ResponseEntity<BoardColumnSimpleResponse> createMyBoardColumn(
           @Valid @RequestBody CreateBoardColumnRequest request,
           @AuthenticationPrincipal Integer userId
   ) {
      var createdBoardColumn = boardColumnService.createMyBoardColumn(request, userId);
      return ResponseEntity.status(HttpStatus.CREATED).body(createdBoardColumn);
   }
}

