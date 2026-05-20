package nhk.task.dto.response;

import java.time.LocalDateTime;

public record CalendarEventResponse(
        Integer id,
        String title,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String color
) {
}

