package nhk.common;

import java.time.LocalDateTime;

public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String message,
        Object data
) {
    public ErrorResponse(int status, String message) {
        this(LocalDateTime.now(), status, message, null);
    }
}
