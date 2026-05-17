package nhk.energy;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import nhk.kanban.entity.TimeBlock;
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
@Table(name = "energy_checkins")
public class EnergyCheckin {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   @Column(name = "id", nullable = false)
   private Long id;

   @ManyToOne(fetch = FetchType.LAZY, optional = false)
   @OnDelete(action = OnDeleteAction.CASCADE)
   @JoinColumn(name = "user_id", nullable = false)
   private User user;

   @Column(name = "energy_level", nullable = false)
   private Integer energyLevel;

   @Column(name = "alertness_level", nullable = false)
   private Integer alertnessLevel;

   @Column(name = "note")
   private String note;

   @ColumnDefault("CURRENT_TIMESTAMP")
   @Column(name = "recorded_at")
   private Instant recordedAt;

   @OneToMany(mappedBy = "checkin")
   private Set<TimeBlock> timeBlocks = new LinkedHashSet<>();

}