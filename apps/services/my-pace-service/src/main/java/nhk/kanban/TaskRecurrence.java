package nhk.kanban;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "task_recurrence")
public class TaskRecurrence {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   @Column(name = "id", nullable = false)
   private Integer id;

   @ManyToOne(fetch = FetchType.LAZY, optional = false)
   @OnDelete(action = OnDeleteAction.CASCADE)
   @JoinColumn(name = "task_id", nullable = false)
   private Task task;

   @Enumerated(EnumType.STRING)
   @Column(name = "frequency", nullable = false, length = 20)
   private FrequencyType frequency;

   @Column(name = "days_of_week", length = 20)
   private String daysOfWeek;

   @Column(name = "start_date", nullable = false)
   private LocalDate startDate;

   @Column(name = "repeat_until")
   private LocalDate repeatUntil;

}