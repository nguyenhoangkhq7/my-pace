package nhk.task.repository;

import nhk.task.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Integer> {
    List<Event> findAllByUser_IdAndStartAtGreaterThanEqualOrderByStartAtAsc(Integer userId, LocalDateTime from);
}

