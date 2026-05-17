package nhk.kanban.exception;

public class BoardColumnNotInBoard extends RuntimeException {
   public BoardColumnNotInBoard(String message) {
      super(message);
   }
}

