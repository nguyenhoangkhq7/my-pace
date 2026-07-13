package nhk.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    @EntityGraph(value = "Task.withChecklists", type = EntityGraph.EntityGraphType.LOAD)
    List<Task> findByUserId(UUID userId);
    @EntityGraph(value = "Task.withChecklists", type = EntityGraph.EntityGraphType.LOAD)
    List<Task> findByUserIdAndStatus(UUID userId, String status);
    boolean existsByGoalId(UUID goalId);
    boolean existsByGoalIdAndDueDate(UUID goalId, java.time.LocalDate dueDate);

    @Query("SELECT COALESCE(SUM(t.actualMinutes), 0) FROM Task t WHERE t.goalId = :goalId AND t.status = 'Done' AND t.dueDate BETWEEN :startDate AND :endDate")
    Integer sumActualMinutesByGoalIdAndDueDateBetween(@Param("goalId") UUID goalId, @Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate);

    @Query("SELECT COALESCE(SUM(t.actualMinutes), 0) FROM Task t WHERE t.goalId = :goalId AND t.status = 'Done'")
    Integer sumActualMinutesByGoalId(@Param("goalId") UUID goalId);

    long countByGoalId(UUID goalId);
    long countByGoalIdAndStatus(UUID goalId, String status);
}
