package nhk.calendar;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface FixedEventService {
    List<FixedEventResponse> getEventsInRange(UUID userId, LocalDate start, LocalDate end);
    FixedEventResponse createEvent(UUID userId, FixedEventRequest request);
    FixedEventResponse updateAllOccurrences(UUID userId, UUID eventId, FixedEventRequest request);
    FixedEventResponse updateSingleOccurrence(UUID userId, UUID eventId, LocalDate occurrenceDate, FixedEventExceptionRequest request);
    FixedEventResponse updateFromDateOnwards(UUID userId, UUID eventId, LocalDate occurrenceDate, FixedEventRequest request);
    void deleteAllOccurrences(UUID userId, UUID eventId);
    void deleteSingleOccurrence(UUID userId, UUID eventId, LocalDate occurrenceDate);
    void deleteFromDateOnwards(UUID userId, UUID eventId, LocalDate occurrenceDate);
}


