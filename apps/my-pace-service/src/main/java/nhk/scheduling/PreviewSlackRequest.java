package nhk.scheduling;

import java.time.LocalDate;

public record PreviewSlackRequest(
    Integer estimatedMinutes,
    Integer actualMinutes,
    LocalDate dueDate
) {}
