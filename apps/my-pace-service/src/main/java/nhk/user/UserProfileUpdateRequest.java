package nhk.user;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

public record UserProfileUpdateRequest(
    String fullName,

    @NotNull(message = "Wake time cannot be null")
    LocalTime wakeTime,

    @NotNull(message = "Sleep time cannot be null")
    LocalTime sleepTime,

    @NotNull(message = "Buffer percentage cannot be null")
    @Min(value = 10, message = "Buffer percentage must be at least 10%")
    @Max(value = 30, message = "Buffer percentage must be at most 30%")
    Integer bufferPct,

    @NotNull(message = "Buffer minutes cannot be null")
    @Min(value = 0, message = "Buffer minutes must be at least 0")
    @Max(value = 60, message = "Buffer minutes must be at most 60")
    Integer bufferMinutes,

    String timezone
) {}
