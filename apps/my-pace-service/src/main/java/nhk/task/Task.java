package nhk.task;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.generator.EventType;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "tasks")
public class Task {
    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "goal_id")
    private UUID goalId;

    @Size(max = 255)
    @NotNull
    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @NotNull
    @Column(name = "actual_minutes", nullable = false)
    private Integer actualMinutes = 0;

    @NotNull
    @Column(name = "is_urgent", nullable = false)
    private Boolean isUrgent = false;

    @NotNull
    @Column(name = "is_important", nullable = false)
    private Boolean isImportant = false;

    @Size(max = 50)
    @NotNull
    @Column(name = "status", nullable = false)
    private String status = "Backlog"; // 'Backlog', 'Picked for Today', 'Done'

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "done_at")
    private OffsetDateTime doneAt;

    @Column(name = "created_at", nullable = false)
    @Generated(event = EventType.INSERT)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    private OffsetDateTime updatedAt;
}
