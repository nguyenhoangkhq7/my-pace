package nhk.calendar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyCheckinRepository extends JpaRepository<DailyCheckin, UUID> {
    Optional<DailyCheckin> findByUserIdAndCheckinDate(UUID userId, LocalDate checkinDate);
}
