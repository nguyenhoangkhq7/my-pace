package nhk.timeblock;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

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
    @Column(name = "daily_plan_id", nullable = false)
    private UUID dailyPlanId;

    @NotNull
    @Column(name = "start_time", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime startTime;

    @NotNull
    @Column(name = "end_time", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime endTime;

    @NotNull
    @Column(name = "part_index", nullable = false)
    private Integer partIndex = 1;

    @NotNull
    @Column(name = "total_parts", nullable = false)
    private Integer totalParts = 1;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
    }
}
