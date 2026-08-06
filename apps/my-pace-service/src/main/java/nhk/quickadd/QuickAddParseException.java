package nhk.quickadd;

public class QuickAddParseException extends RuntimeException {
    public QuickAddParseException(String message) {
        super(message);
    }

    public QuickAddParseException(String message, Throwable cause) {
        super(message, cause);
    }
}
