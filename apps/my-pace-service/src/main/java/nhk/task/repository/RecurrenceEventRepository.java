package nhk.task.repository;

import nhk.task.entity.RecurrenceEvent;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface RecurrenceEventRepository extends JpaRepository<RecurrenceEvent, Integer> {
    @EntityGraph(attributePaths = {"event"})
    List<RecurrenceEvent> findAllByUser_IdAndIsCancelledFalseOrderByStartAtAsc(Integer userId);

    @EntityGraph(attributePaths = {"event"})
    List<RecurrenceEvent> findAllByUser_IdAndIsCancelledFalseAndStartAtGreaterThanEqualOrderByStartAtAsc(Integer userId, LocalDateTime from);
}

