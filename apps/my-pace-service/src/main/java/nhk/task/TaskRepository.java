package nhk.task;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    @EntityGraph(value = "Task.withChecklists", type = EntityGraph.EntityGraphType.LOAD)
    List<Task> findByUserId(UUID userId);
    @EntityGraph(value = "Task.withChecklists", type = EntityGraph.EntityGraphType.LOAD)
    List<Task> findByUserIdAndStatus(UUID userId, String status);
    @EntityGraph(value = "Task.withChecklists", type = EntityGraph.EntityGraphType.LOAD)
    List<Task> findByUserIdAndStatusNot(UUID userId, String status);
    boolean existsByGoalId(UUID goalId);
    @Query("SELECT COUNT(t) > 0 FROM Task t WHERE t.goalId = :goalId AND t.dueDate >= :start AND t.dueDate < :end")
    boolean existsByGoalIdAndDueDate(@Param("goalId") UUID goalId, @Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query("SELECT COALESCE(SUM(t.actualMinutes), 0) FROM Task t WHERE t.goalId = :goalId AND t.status = 'Done' AND t.dueDate >= :start AND t.dueDate < :end")
    Integer sumActualMinutesByGoalIdAndDueDateBetween(@Param("goalId") UUID goalId, @Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query("SELECT COALESCE(SUM(t.actualMinutes), 0) FROM Task t WHERE t.goalId = :goalId AND t.status = 'Done'")
    Integer sumActualMinutesByGoalId(@Param("goalId") UUID goalId);

    long countByGoalId(UUID goalId);
    long countByGoalIdAndStatus(UUID goalId, String status);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.userId = :userId AND t.status != 'Done' AND t.dueDate < :now")
    long countOverdueTasks(@Param("userId") UUID userId, @Param("now") java.time.LocalDateTime now);

    @Query("SELECT t FROM Task t WHERE t.userId = :userId AND t.status != 'Done' AND t.dueDate < :now")
    List<Task> findOverdueTasks(@Param("userId") UUID userId, @Param("now") java.time.LocalDateTime now);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Task t SET t.categoryId = :categoryId, t.updatedAt = CURRENT_TIMESTAMP WHERE t.goalId = :goalId")
    int updateCategoryIdByGoalId(@Param("goalId") UUID goalId, @Param("categoryId") UUID categoryId);
}
