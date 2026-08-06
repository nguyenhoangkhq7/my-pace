package nhk.scheduling;

import java.time.LocalDate;

public record AutoScheduleWeekRequest(
    LocalDate startDate,
    Integer bufferMinutes,
    Boolean singleDayOnly
) {}
