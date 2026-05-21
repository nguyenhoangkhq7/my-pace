package nhk.task.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import nhk.user.User;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "parent_id")
    private Task parent;

    @Size(max = 255)
    @NotNull
    @Column(name = "title", nullable = false)
    private String title;

    @ColumnDefault("65536")
    @Column(name = "position")
    private Double position = 65536.0;

    @Enumerated(EnumType.STRING)
    @ColumnDefault("'TODO'")
    @Column(name = "status", length = 20)
    private TaskStatus status = TaskStatus.TODO;

    @ColumnDefault("0")
    @Column(name = "is_done")
    private Boolean isDone = false;

    @Convert(converter = EnergyRequiredConverter.class)
    @ColumnDefault("2")
    @Column(name = "energy_required")
    private EnergyRequired energyRequired = EnergyRequired.MEDIUM;

    @ColumnDefault("0")
    @Column(name = "is_important", nullable = false)
    private Boolean isImportant = false;

    @Column(name = "estimated_minutes")
    private Short estimatedMinutes;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private TaskDetail detail;


}

