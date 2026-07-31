package nhk.category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByUserIdOrderByNameAsc(UUID userId);
    List<Category> findByUserIdAndIdIn(UUID userId, Collection<UUID> ids);
    List<Category> findByUserIdAndTimeContextId(UUID userId, UUID timeContextId);

    @Modifying
    @Query("UPDATE Category c SET c.timeContext = NULL WHERE c.timeContext.id = :timeContextId")
    void clearTimeContextId(UUID timeContextId);
}
