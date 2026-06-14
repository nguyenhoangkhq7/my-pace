package nhk.task.repository;

import nhk.task.entity.Event;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Integer> {
    @EntityGraph(attributePaths = {"user"})
    List<Event> findAllByUser_IdOrderByStartAtAsc(Integer userId);

    @EntityGraph(attributePaths = {"user"})
    List<Event> findAllByUser_IdAndStartAtGreaterThanEqualOrderByStartAtAsc(Integer userId, LocalDateTime from);

    @EntityGraph(attributePaths = {"user"})
    Optional<Event> findByIdAndUser_Id(Integer id, Integer userId);
}

