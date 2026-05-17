package nhk.kanban.repository;

import nhk.kanban.entity.Context;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ContextRepository extends JpaRepository<Context, Integer> {
   Optional<Context> findByIdAndUserId(Integer id, Integer userId);
}

