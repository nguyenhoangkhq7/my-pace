package nhk.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByUserId(UUID userId);
    List<Task> findByUserIdAndStatus(UUID userId, String status);
    boolean existsByGoalId(UUID goalId);

    @Query("SELECT COALESCE(SUM(t.actualMinutes), 0) FROM Task t WHERE t.goalId = :goalId AND t.status = 'Done'")
    Integer sumActualMinutesByGoalId(@Param("goalId") UUID goalId);

    long countByGoalId(UUID goalId);
    long countByGoalIdAndStatus(UUID goalId, String status);
}
