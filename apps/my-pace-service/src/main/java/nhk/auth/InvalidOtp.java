package nhk.auth;

public class InvalidOtp extends RuntimeException {
    public InvalidOtp(String message) {
        super(message);
    }
}
