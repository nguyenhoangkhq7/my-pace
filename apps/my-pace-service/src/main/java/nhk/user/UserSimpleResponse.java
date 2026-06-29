package nhk.user;

import java.time.LocalTime;

public record UserSimpleResponse (
    String id,
    String name,
    String email,
    String role,
    LocalTime wakeTime,
    LocalTime sleepTime,
    Integer bufferPct
) {
}
