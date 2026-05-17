package nhk.kanban.repository;

import nhk.kanban.entity.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BoardColumnRepository extends JpaRepository<BoardColumn, Integer> {
    Optional<BoardColumn> findByIdAndBoardId(Integer id, Integer boardId);
}

