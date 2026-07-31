package nhk.task;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@EntityListeners(org.springframework.data.jpa.domain.support.AuditingEntityListener.class)
@Table(name = "tasks")
@NamedEntityGraph(name = "Task.withChecklists", attributeNodes = @NamedAttributeNode("checklists"))
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

    @Column(name = "category_id")
    private UUID categoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", insertable = false, updatable = false)
    private nhk.category.Category category;

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

    @NotNull
    @Column(name = "is_splittable", nullable = false)
    private Boolean isSplittable = false;

    @Column(name = "min_chunk_minutes")
    private Integer minChunkMinutes;

    @Column(name = "max_daily_duration")
    private Integer maxDailyDuration;

    @Size(max = 50)
    @NotNull
    @Column(name = "status", nullable = false)
    private String status = "Backlog"; // 'Backlog', 'Picked for Today', 'Done'

    @Column(name = "due_date")
    private java.time.LocalDateTime dueDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "done_at")
    private OffsetDateTime doneAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @org.springframework.data.annotation.CreatedDate
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @org.springframework.data.annotation.LastModifiedDate
    private OffsetDateTime updatedAt;

    @Size(max = 20)
    @NotNull
    @Column(name = "task_type", nullable = false)
    private String taskType = "AD_HOC"; // 'AD_HOC', 'GOAL_SESSION'

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TaskChecklistItem> checklists = new ArrayList<>();
}
