package nhk.goal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

@Repository
public interface GoalRepository extends JpaRepository<Goal, UUID> {
    List<Goal> findByUserId(UUID userId);
    List<Goal> findByUserIdAndStatus(UUID userId, String status);
    int countByUserIdAndStatus(UUID userId, String status);

    @Modifying
    @Query("UPDATE Goal g SET g.categoryId = null WHERE g.categoryId = :categoryId")
    void clearCategoryId(@Param("categoryId") UUID categoryId);
}
