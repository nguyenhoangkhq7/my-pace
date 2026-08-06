package nhk.calendar;

import jakarta.persistence.*;
import lombok.*;
import nhk.category.Category;
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
@Table(name = "fixed_event_exceptions")
public class FixedEventException {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fixed_event_id", nullable = false)
    private FixedEvent fixedEvent;

    /** The specific date this exception applies to. */
    @Column(name = "occurrence_date", nullable = false)
    private LocalDate occurrenceDate;

    /** If true, this occurrence is soft-deleted (hidden). */
    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "override_title", length = 255)
    private String overrideTitle;

    @Column(name = "override_notes")
    private String overrideNotes;

    @Column(name = "override_start_time")
    private LocalTime overrideStartTime;

    @Column(name = "override_end_time")
    private LocalTime overrideEndTime;

    @Column(name = "override_is_all_day")
    private Boolean overrideIsAllDay;

    @Column(name = "override_availability_status", length = 20)
    private String overrideAvailabilityStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "override_category_id")
    private Category overrideCategory;

    @Column(name = "created_at", nullable = false, updatable = false)
    @org.springframework.data.annotation.CreatedDate
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @org.springframework.data.annotation.LastModifiedDate
    private OffsetDateTime updatedAt;
}
