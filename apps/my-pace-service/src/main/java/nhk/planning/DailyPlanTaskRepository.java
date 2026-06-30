package nhk.planning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface DailyPlanTaskRepository extends JpaRepository<DailyPlanTask, UUID> {
    List<DailyPlanTask> findByDailyPlanIdOrderBySortOrderAsc(UUID dailyPlanId);
    
    @Modifying
    @Query("DELETE FROM DailyPlanTask d WHERE d.dailyPlanId = :dailyPlanId")
    void deleteByDailyPlanId(@Param("dailyPlanId") UUID dailyPlanId);
}
