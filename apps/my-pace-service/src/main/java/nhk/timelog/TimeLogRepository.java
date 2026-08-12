package nhk.timelog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TimeLogRepository extends JpaRepository<TimeLog, UUID> {

    java.util.Optional<TimeLog> findTopByUserIdOrderByCreatedAtDesc(UUID userId);

    List<TimeLog> findByTimeBlockIdOrderByStartedAtAsc(UUID timeBlockId);

    List<TimeLog> findByTaskIdOrderByStartedAtAsc(UUID taskId);

    List<TimeLog> findByUserIdAndStartedAtBetweenOrderByStartedAtAsc(UUID userId, OffsetDateTime start, OffsetDateTime end);

    List<TimeLog> findByTimeBlockIdIn(List<UUID> timeBlockIds);

    @Query("SELECT COALESCE(SUM(tl.loggedMinutes), 0) FROM TimeLog tl WHERE tl.taskId = :taskId")
    Integer sumLoggedMinutesByTaskId(@Param("taskId") UUID taskId);

    // A1: Daily summary for a user in a date range
    @Query("SELECT COALESCE(SUM(tl.loggedMinutes), 0) FROM TimeLog tl WHERE tl.userId = :userId AND tl.startedAt >= :start AND tl.startedAt <= :end")
    Integer sumLoggedMinutesByUserIdAndDateRange(@Param("userId") UUID userId, @Param("start") OffsetDateTime start, @Param("end") OffsetDateTime end);

    // B1: Hourly focus minutes — native query for timezone-aware EXTRACT
    @Query(value = """
        SELECT EXTRACT(HOUR FROM (started_at AT TIME ZONE :timezone)) AS hour,
               SUM(logged_minutes) AS total_minutes
        FROM time_logs
        WHERE user_id = :userId
          AND started_at >= :start
          AND started_at <= :end
        GROUP BY hour
        ORDER BY hour
        """, nativeQuery = true)
    List<Object[]> findHourlyFocusMinutes(
        @Param("userId") UUID userId,
        @Param("start") OffsetDateTime start,
        @Param("end") OffsetDateTime end,
        @Param("timezone") String timezone
    );

    // C1: Overlap detection — find logs that overlap the given window for a user
    @Query("SELECT tl FROM TimeLog tl WHERE tl.userId = :userId AND tl.startedAt < :endedAt AND tl.endedAt > :startedAt")
    List<TimeLog> findOverlapping(
        @Param("userId") UUID userId,
        @Param("startedAt") OffsetDateTime startedAt,
        @Param("endedAt") OffsetDateTime endedAt
    );
}
