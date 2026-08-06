package nhk.quickadd;

public class QuickAddExternalServiceException extends RuntimeException {
    public QuickAddExternalServiceException(String message) {
        super(message);
    }

    public QuickAddExternalServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
