package nhk.calendar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface FixedEventRepository extends JpaRepository<FixedEvent, UUID> {

    /**
     * Returns all fixed_event rows for a user that could produce occurrences in [start, end]:
     * - Non-recurring: event_date falls within the range.
     * - Recurring: the series hasn't ended before `start` (i.e., recurrence_end_date is NULL or >= start).
     */
    @Query("""
            SELECT fe FROM FixedEvent fe
            WHERE fe.user.id = :userId
              AND (
                   (fe.recurrenceType = 'NONE' AND fe.eventDate BETWEEN :start AND :end)
                OR (fe.recurrenceType <> 'NONE'
                    AND (fe.recurrenceEndDate IS NULL OR fe.recurrenceEndDate >= :start)
                    AND (fe.eventDate IS NULL OR fe.eventDate <= :end)
                   )
              )
            """)
    List<FixedEvent> findActiveInRange(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end
    );

    /** Fetch all non-recurring events for a specific date plus all recurring series active on that date. */
    @Query("""
            SELECT fe FROM FixedEvent fe
            WHERE fe.user.id = :userId
              AND (
                   (fe.recurrenceType = 'NONE' AND fe.eventDate = :date)
                OR (fe.recurrenceType <> 'NONE'
                    AND (fe.eventDate IS NULL OR fe.eventDate <= :date)
                    AND (fe.recurrenceEndDate IS NULL OR fe.recurrenceEndDate >= :date)
                   )
              )
            """)
    List<FixedEvent> findActiveOnDate(
            @Param("userId") UUID userId,
            @Param("date") LocalDate date
    );
}
