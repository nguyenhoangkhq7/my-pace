package nhk.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalTime;

@Getter
@Setter
@Entity
@Table(name = "energy_profiles")
public class EnergyProfile {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   @Column(name = "id", nullable = false)
   private Integer id;

   @ManyToOne(fetch = FetchType.LAZY, optional = false)
   @OnDelete(action = OnDeleteAction.CASCADE)
   @JoinColumn(name = "user_id", nullable = false)
   private User user;

   @Column(name = "peak_start_time")
   private LocalTime peakStartTime;

   @Column(name = "peak_end_time")
   private LocalTime peakEndTime;

   @ColumnDefault("15")
   @Column(name = "default_buffer_minutes")
   private Integer defaultBufferMinutes;

}