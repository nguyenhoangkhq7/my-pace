package nhk.timeblock;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "task_time_blocks")
public class TaskTimeBlock {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @NotNull
    @Column(name = "start_time", nullable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime startTime;

    @NotNull
    @Column(name = "end_time", nullable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime endTime;

    @NotNull
    @Column(name = "part_index", nullable = false)
    private Integer partIndex = 1;

    @NotNull
    @Column(name = "total_parts", nullable = false)
    private Integer totalParts = 1;

    @NotNull
    @Column(name = "actual_minutes", nullable = false)
    private Integer actualMinutes = 0;

    @NotNull
    @Column(name = "is_completed", nullable = false)
    private Boolean isCompleted = false;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @NotNull
    @Column(name = "availability_status", nullable = false)
    private String availabilityStatus = "FREE";

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
    }
}
