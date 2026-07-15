package nhk.goal;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@EntityListeners(org.springframework.data.jpa.domain.support.AuditingEntityListener.class)
@org.hibernate.annotations.SQLDelete(sql = "UPDATE goals SET is_deleted = true WHERE id = ?")
@org.hibernate.annotations.SQLRestriction("is_deleted = false")
@Table(name = "goals")
public class Goal {
    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Size(max = 255)
    @NotNull
    @Column(name = "title", nullable = false)
    private String title;

    @Size(max = 50)
    @NotNull
    @Column(name = "goal_type", nullable = false)
    private String goalType; // 'Time-boxed', 'Milestone', 'Binary'

    @Size(max = 50)
    @NotNull
    @Column(name = "status", nullable = false)
    private String status = "In Progress"; // 'Freeze', 'In Progress', 'Done', 'Archived'

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    @org.springframework.data.annotation.CreatedDate
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @org.springframework.data.annotation.LastModifiedDate
    private OffsetDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
    @Column(name = "category_id")
    private UUID categoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", insertable = false, updatable = false)
    private nhk.category.Category category;

    @Column(name = "progress_pct", nullable = false)
    private Integer progressPct = 0;

    @NotNull
    @Column(name = "auto_create_task", nullable = false)
    private Boolean autoCreateTask = false;



    // Fields migrated from TimeBoxedGoal
    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "days_of_week")
    private String daysOfWeek = "1,2,3,4,5,6,7";

    @Column(name = "prefer_time")
    private java.time.LocalTime preferTime;
}
