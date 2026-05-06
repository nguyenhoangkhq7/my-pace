package nhk.kanban;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BoardRepository extends JpaRepository<Board, Long> {
    Optional<List<Board>> getBoardsByUserId(Integer userId);

    @EntityGraph(attributePaths = {"boardColumns", "boardColumns.tasks"})
    Optional<Board> findByIdAndUserId(Integer id, Integer userId);
}