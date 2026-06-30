package nhk.calendar;

import jakarta.persistence.*;
import lombok.*;
import nhk.user.User;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.generator.EventType;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "daily_checkins")
public class DailyCheckin {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "checkin_date", nullable = false)
    private LocalDate checkinDate;

    @Column(name = "checkin_time", nullable = false)
    private LocalTime checkinTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Generated(event = EventType.INSERT)
    private OffsetDateTime createdAt;
}
