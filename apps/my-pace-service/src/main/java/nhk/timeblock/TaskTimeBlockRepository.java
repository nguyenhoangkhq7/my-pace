package nhk.timeblock;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskTimeBlockRepository extends JpaRepository<TaskTimeBlock, UUID> {

    @Query("SELECT ttb FROM TaskTimeBlock ttb JOIN Task t ON ttb.taskId = t.id WHERE t.userId = :userId AND ttb.startTime >= :startDate AND ttb.endTime <= :endDate ORDER BY ttb.startTime ASC")
    List<TaskTimeBlock> findByUserIdAndDateRange(@Param("userId") UUID userId, @Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);

    List<TaskTimeBlock> findByTaskId(UUID taskId);

    List<TaskTimeBlock> findByTaskIdIn(List<UUID> taskIds);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM TaskTimeBlock ttb WHERE ttb.taskId IN (SELECT t.id FROM Task t WHERE t.userId = :userId) AND ttb.startTime >= :startOfDay AND ttb.startTime < :endOfDay")
    void deleteByUserIdAndDate(@Param("userId") UUID userId, @Param("startOfDay") java.time.LocalDateTime startOfDay, @Param("endOfDay") java.time.LocalDateTime endOfDay);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM TaskTimeBlock t WHERE t.taskId = :taskId")
    void deleteByTaskId(@Param("taskId") UUID taskId);
}
