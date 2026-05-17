package nhk.kanban.exception;

public class BoardNotFound extends RuntimeException {
   public BoardNotFound(String message) {
      super(message);
   }
}
