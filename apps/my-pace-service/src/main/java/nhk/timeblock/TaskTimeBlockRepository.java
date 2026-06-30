package nhk.timeblock;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskTimeBlockRepository extends JpaRepository<TaskTimeBlock, UUID> {

    List<TaskTimeBlock> findByDailyPlanIdOrderByStartTimeAsc(UUID dailyPlanId);

    List<TaskTimeBlock> findByTaskIdAndDailyPlanId(UUID taskId, UUID dailyPlanId);

    @Modifying
    @Query("DELETE FROM TaskTimeBlock t WHERE t.dailyPlanId = :planId")
    void deleteByDailyPlanId(@Param("planId") UUID planId);
}
