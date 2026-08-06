package nhk.scheduling.event;

import java.time.LocalDate;
import java.util.UUID;

public record FixedEventChangedEvent(UUID userId, LocalDate eventDate) {}
