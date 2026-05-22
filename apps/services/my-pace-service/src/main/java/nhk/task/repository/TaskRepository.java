package nhk.task.repository;

import nhk.task.entity.Task;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Integer> {
    @EntityGraph(attributePaths = {"category", "parent", "detail"})
    List<Task> findAllByUserIdOrderByCreatedAtDesc(Integer userId);

    @EntityGraph(attributePaths = {"category", "parent", "detail"})
    List<Task> findAllByUserIdAndCategoryIdOrderByCreatedAtDesc(Integer userId, Integer categoryId);

    @EntityGraph(attributePaths = {"category", "parent", "detail"})
    Optional<Task> findByIdAndUserId(Integer id, Integer userId);
}

