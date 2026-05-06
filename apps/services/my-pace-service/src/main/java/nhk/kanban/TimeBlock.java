package nhk.kanban;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import nhk.energy.EnergyCheckin;
import nhk.user.User;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "time_blocks")
public class TimeBlock {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   @Column(name = "id", nullable = false)
   private Long id;

   @ManyToOne(fetch = FetchType.LAZY, optional = false)
   @OnDelete(action = OnDeleteAction.CASCADE)
   @JoinColumn(name = "user_id", nullable = false)
   private User user;

   @ManyToOne(fetch = FetchType.LAZY)
   @OnDelete(action = OnDeleteAction.CASCADE)
   @JoinColumn(name = "task_id")
   private Task task;

   @ManyToOne(fetch = FetchType.LAZY)
   @OnDelete(action = OnDeleteAction.SET_NULL)
   @JoinColumn(name = "checkin_id")
   private EnergyCheckin checkin;

   @Column(name = "block_type", nullable = false, length = 20)
   private String blockType;

   @ColumnDefault("0")
   @Column(name = "is_locked")
   private Boolean isLocked;

   @Column(name = "scheduled_start", nullable = false)
   private Instant scheduledStart;

   @Column(name = "scheduled_end", nullable = false)
   private Instant scheduledEnd;

   @Column(name = "actual_start")
   private Instant actualStart;

   @Column(name = "actual_end")
   private Instant actualEnd;

   @Column(name = "title_override")
   private String titleOverride;

}