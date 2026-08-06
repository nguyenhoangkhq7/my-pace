package nhk.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpRepository extends JpaRepository<OtpEntity, UUID> {
    Optional<OtpEntity> findByEmail(String email);
    
    @Modifying
    @Query("DELETE FROM OtpEntity o WHERE o.expiresAt < :now")
    void deleteExpiredOtps(LocalDateTime now);
}
