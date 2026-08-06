package nhk.category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByUserIdOrderByNameAsc(UUID userId);
    List<Category> findByUserIdAndIdIn(UUID userId, Collection<UUID> ids);
    List<Category> findByUserIdAndTimeContextId(UUID userId, UUID timeContextId);

    /**
     * Eagerly fetches TimeContext and its Slots in a single query.
     * Used by auto-schedule to avoid LazyInitializationException when
     * accessing tc.getSlots() outside of an active Hibernate session proxy.
     */
    @Query("SELECT DISTINCT c FROM Category c LEFT JOIN FETCH c.timeContext tc LEFT JOIN FETCH tc.slots WHERE c.userId = :userId ORDER BY c.name ASC")
    List<Category> findByUserIdWithTimeContext(@Param("userId") UUID userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Category c SET c.timeContext = NULL WHERE c.timeContext.id = :timeContextId")
    void clearTimeContextId(UUID timeContextId);
}
