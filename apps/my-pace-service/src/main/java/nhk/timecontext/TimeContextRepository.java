package nhk.timecontext;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TimeContextRepository extends JpaRepository<TimeContext, UUID> {
    List<TimeContext> findByUserIdOrderByNameAsc(UUID userId);
    Optional<TimeContext> findByIdAndUserId(UUID id, UUID userId);
}
