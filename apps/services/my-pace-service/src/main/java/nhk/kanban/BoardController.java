package nhk.kanban;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

   @GetMapping("/{id}")
   public Board getBoard(@PathVariable Long id) {
      var board = boardService.getBoard(id);
      if(board == null) {
         throw new BoardNotFound("Board not found");
      }
      return board;
   }

   @ExceptionHandler(BoardNotFound.class)
   public ResponseEntity<String> handleBoardNotFound(BoardNotFound exception) {
      return ResponseEntity.status(404).body(exception.getMessage());
   }
}
