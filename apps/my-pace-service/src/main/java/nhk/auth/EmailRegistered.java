package nhk.auth;

public class EmailRegistered extends RuntimeException {
    public EmailRegistered(String message) {
        super(message);
    }
}
