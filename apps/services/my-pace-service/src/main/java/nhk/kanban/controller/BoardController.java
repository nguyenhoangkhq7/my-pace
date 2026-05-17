package nhk.kanban.controller;

import lombok.AllArgsConstructor;
import nhk.kanban.service.BoardService;
import nhk.kanban.dto.BoardSimpleResponse;
import nhk.kanban.dto.CreateBoardRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/boards")
class BoardController {
   private final BoardService boardService;

   @GetMapping
   public ResponseEntity<List<BoardSimpleResponse>> getMyBoards(@AuthenticationPrincipal Integer userId) {
      var boards = boardService.getMyBoards(userId);
      return ResponseEntity.ok(boards);
   }

   @GetMapping("/{id}")
   public ResponseEntity<BoardSimpleResponse> getMyBoard(@PathVariable Integer id, @AuthenticationPrincipal Integer userId) {
      var board = boardService.getMyBoard(id, userId);
      return ResponseEntity.ok(board);
   }

   @PostMapping
   public ResponseEntity<BoardSimpleResponse> createMyBoard(@RequestBody CreateBoardRequest request, @AuthenticationPrincipal Integer userId) {
      var createdBoard = boardService.createMyBoard(request, userId);
      return ResponseEntity.status(HttpStatus.CREATED).body(createdBoard);
   }

   @DeleteMapping("/{id}")
   public ResponseEntity<Void> deleteMyBoard(@PathVariable Integer id, @AuthenticationPrincipal Integer userId) {
      boardService.deleteMyBoard(id, userId);
      return ResponseEntity.noContent().build();
   }
}
