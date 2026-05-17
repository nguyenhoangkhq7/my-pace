package nhk.kanban.exception;

public class BoardColumnNotFound extends RuntimeException {
   public BoardColumnNotFound(String message) {
      super(message);
   }
}

