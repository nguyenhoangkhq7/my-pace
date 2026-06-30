package nhk.calendar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FixedEventExceptionRepository extends JpaRepository<FixedEventException, UUID> {

    /** All exceptions for a given series in a date range. */
    List<FixedEventException> findByFixedEventIdAndOccurrenceDateBetween(
            UUID fixedEventId, LocalDate start, LocalDate end
    );

    /** Find exception for a specific occurrence date (for upsert logic). */
    Optional<FixedEventException> findByFixedEventIdAndOccurrenceDate(
            UUID fixedEventId, LocalDate occurrenceDate
    );

    /** Delete all exceptions for a series (used when updating ALL occurrences). */
    void deleteAllByFixedEventId(UUID fixedEventId);

    /** All exceptions for a list of event IDs, within a date range. */
    List<FixedEventException> findByFixedEventIdInAndOccurrenceDateBetween(
            List<UUID> fixedEventIds, LocalDate start, LocalDate end
    );
}
