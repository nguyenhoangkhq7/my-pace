package nhk.board.controller;

import lombok.AllArgsConstructor;
import nhk.board.exception.BoardNotFound;
import nhk.board.service.BoardService;
import nhk.entity.Board;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
@RestController
@RequestMapping("/board")
class BoardController {
   private final BoardService boardService;

   @GetMapping
   public List<Board> getBoards() {
      var boards = boardService.getBoards();
      if(boards.isEmpty()) {
         throw new BoardNotFound("No boards found");
      }
      return boards;
   }

   @ExceptionHandler(BoardNotFound.class)
   public ResponseEntity<String> handleBoardNotFound(BoardNotFound exception) {
      return ResponseEntity.status(404).body(exception.getMessage());
   }
}
