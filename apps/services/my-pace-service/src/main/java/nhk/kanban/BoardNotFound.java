package nhk.kanban;

public class BoardNotFound extends RuntimeException {
   public BoardNotFound(String message) {
      super(message);
   }
}
