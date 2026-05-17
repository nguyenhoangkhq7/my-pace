package nhk.kanban.repository;

import nhk.kanban.entity.Board;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BoardRepository extends JpaRepository<Board, Long> {
    Optional<List<Board>> getBoardsByUserId(Integer userId);

    @EntityGraph(attributePaths = {"boardColumns", "boardColumns.tasks", "boardColumns.tasks.context"})
    Optional<Board> findByIdAndUserId(Integer id, Integer userId);
}