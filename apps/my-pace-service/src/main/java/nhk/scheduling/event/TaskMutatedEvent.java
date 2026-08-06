package nhk.scheduling.event;

import java.time.LocalDate;
import java.util.UUID;

public record TaskMutatedEvent(UUID userId, UUID taskId, LocalDate affectedDate) {}
