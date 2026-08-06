package nhk.planning;

import lombok.Builder;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Builder(toBuilder = true)
public record DailyPlanDto(
    UUID id,
    UUID userId,
    LocalDate planDate,
    Integer availableMinutes,
    Boolean isConfirmed,
    OffsetDateTime confirmedAt,
    Boolean isReviewed,
    List<DailyPlanTaskDto> tasks
) {}
