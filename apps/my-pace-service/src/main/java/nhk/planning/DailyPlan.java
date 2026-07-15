package nhk.planning;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "daily_plans")
public class DailyPlan {
    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotNull
    @Column(name = "plan_date", nullable = false)
    private LocalDate planDate;

    @NotNull
    @Column(name = "available_minutes", nullable = false)
    private Integer availableMinutes;

    @NotNull
    @Column(name = "is_confirmed", nullable = false)
    private Boolean isConfirmed = false;

    @Column(name = "confirmed_at")
    private OffsetDateTime confirmedAt;

    @NotNull
    @Column(name = "is_reviewed", nullable = false)
    private Boolean isReviewed = false;
}
