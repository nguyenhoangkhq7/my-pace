package nhk.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import nhk.enums.ImpactType;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "tasks")
public class Task {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   @Column(name = "id", nullable = false)
   private Integer id;

   @ManyToOne(fetch = FetchType.LAZY, optional = false)
   @OnDelete(action = OnDeleteAction.CASCADE)
   @JoinColumn(name = "user_id", nullable = false)
   private User user;

   @ManyToOne(fetch = FetchType.LAZY)
   @OnDelete(action = OnDeleteAction.SET_NULL)
   @JoinColumn(name = "column_id")
   private BoardColumn column;

   @ColumnDefault("0")
   @Column(name = "position")
   private Integer position;

   @ManyToOne(fetch = FetchType.LAZY)
   @OnDelete(action = OnDeleteAction.SET_NULL)
   @JoinColumn(name = "context_id")
   private Context context;

   @Column(name = "title", nullable = false)
   private String title;

   @Column(name = "description", columnDefinition = "TEXT")
   private String description;

   @ColumnDefault("3")
   @Column(name = "energy_required", nullable = false)
   private Integer energyRequired;

   @ColumnDefault("'DRAIN'")
   @Enumerated(EnumType.STRING)
   @Column(name = "impact_type", length = 20)
   private ImpactType impactType;

   @ColumnDefault("30")
   @Column(name = "estimated_minutes")
   private Short estimatedMinutes;

   @ColumnDefault("1")
   @Column(name = "priority")
   private Integer priority;

   @ColumnDefault("0")
   @Column(name = "is_recurring")
   private Boolean isRecurring;

   @Column(name = "due_date")
   private Instant dueDate;

   @ColumnDefault("CURRENT_TIMESTAMP")
   @Column(name = "created_at")
   private Instant createdAt;

   @OneToMany(mappedBy = "task")
   private Set<TaskRecurrence> taskRecurrences = new LinkedHashSet<>();

   @OneToMany(mappedBy = "task")
   private Set<TimeBlock> timeBlocks = new LinkedHashSet<>();

}