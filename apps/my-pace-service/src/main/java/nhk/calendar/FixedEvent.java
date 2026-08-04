package nhk.calendar;

import jakarta.persistence.*;
import lombok.*;
import nhk.category.Category;
import nhk.user.User;
import org.hibernate.annotations.UuidGenerator;

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
@EntityListeners(org.springframework.data.jpa.domain.support.AuditingEntityListener.class)
@Table(name = "fixed_events")
public class FixedEvent {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "notes")
    private String notes;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Builder.Default
    @Column(name = "is_all_day", nullable = false)
    private Boolean isAllDay = false;

    /**
     * BUSY | FREE
     * Stored as VARCHAR in DB.
     */
    @Builder.Default
    @Column(name = "availability_status", nullable = false, length = 20)
    private String availabilityStatus = "BUSY";

    /**
     * NONE | DAILY | WEEKLY | CUSTOM
     * Stored as VARCHAR in DB.
     */
    @Column(name = "recurrence_type", nullable = false, length = 50)
    private String recurrenceType;

    /**
     * For WEEKLY / CUSTOM: comma-separated day-of-week numbers (1=Mon … 7=Sun).
     * Example: "1,3,5" means Mon, Wed, Fri.
     */
    @Column(name = "recurrence_rule")
    private String recurrenceRule;

    @Column(name = "recurrence_end_date")
    private LocalDate recurrenceEndDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    @org.springframework.data.annotation.CreatedDate
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @org.springframework.data.annotation.LastModifiedDate
    private OffsetDateTime updatedAt;
}
