package nhk.planning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyPlanRepository extends JpaRepository<DailyPlan, UUID> {
    Optional<DailyPlan> findByUserIdAndPlanDate(UUID userId, LocalDate planDate);
    java.util.List<DailyPlan> findByUserIdAndPlanDateBetweenOrderByPlanDateAsc(UUID userId, LocalDate startDate, LocalDate endDate);
    Optional<DailyPlan> findFirstByUserIdAndPlanDateBeforeAndIsConfirmedTrueAndIsReviewedFalseOrderByPlanDateDesc(UUID userId, LocalDate planDate);
    java.util.List<DailyPlan> findByUserIdAndPlanDateBeforeAndIsConfirmedFalse(UUID userId, LocalDate planDate);
}
