package nhk.kanban.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import nhk.user.User;
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
   @Column(name = "energy_required")
   private Integer energyRequired = 3;

   @ColumnDefault("'DRAIN'")
   @Enumerated(EnumType.STRING)
   @Column(name = "impact_type", length = 20)
   private ImpactType impactType = ImpactType.DRAIN;

   @ColumnDefault("30")
   @Column(name = "estimated_minutes")
   private Short estimatedMinutes = 30;

   @ColumnDefault("1")
   @Column(name = "priority")
   private Integer priority = 1;

   @ColumnDefault("0")
   @Column(name = "is_recurring")
   private Boolean isRecurring = false;

   @ColumnDefault("0")
   @Column(name = "is_done")
   private Boolean isDone = false;

   @Column(name = "due_date")
   private Instant dueDate;

   @ColumnDefault("CURRENT_TIMESTAMP")
   @Column(name = "created_at")
   private Instant createdAt = Instant.now();

   @OneToMany(mappedBy = "task")
   private Set<TaskRecurrence> taskRecurrences = new LinkedHashSet<>();

   @OneToMany(mappedBy = "task")
   private Set<TimeBlock> timeBlocks = new LinkedHashSet<>();

   @PrePersist
   void prePersist() {
      if (energyRequired == null) {
         energyRequired = 3;
      }
      if (impactType == null) {
         impactType = ImpactType.DRAIN;
      }
      if (estimatedMinutes == null) {
         estimatedMinutes = 30;
      }
      if (priority == null) {
         priority = 1;
      }
      if (isRecurring == null) {
         isRecurring = false;
      }
      if (isDone == null) {
         isDone = false;
      }
      if (createdAt == null) {
         createdAt = Instant.now();
      }
      if (position == null) {
         position = 0;
      }
   }
}