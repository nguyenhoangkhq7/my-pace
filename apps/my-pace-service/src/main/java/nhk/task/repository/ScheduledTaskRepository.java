package nhk.task.repository;

import nhk.task.entity.ScheduledTask;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ScheduledTaskRepository extends JpaRepository<ScheduledTask, Integer> {
    @EntityGraph(attributePaths = {"task", "task.user", "task.category", "task.parent", "task.detail"})
    List<ScheduledTask> findAllByUser_IdOrderByStartTimeAsc(Integer userId);

    @EntityGraph(attributePaths = {"task", "task.user", "task.category", "task.parent", "task.detail"})
    List<ScheduledTask> findAllByUser_Id(Integer userId);

    @EntityGraph(attributePaths = {"task", "task.user", "task.category", "task.parent", "task.detail"})
    Optional<ScheduledTask> findByIdAndUser_Id(Integer id, Integer userId);

    @EntityGraph(attributePaths = {"task", "task.user", "task.category", "task.parent", "task.detail"})
    Optional<ScheduledTask> findByTask_IdAndUser_Id(Integer taskId, Integer userId);
}

