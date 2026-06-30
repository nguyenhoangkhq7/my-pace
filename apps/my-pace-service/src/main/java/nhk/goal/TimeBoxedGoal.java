package nhk.goal;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "time_boxed_goals")
public class TimeBoxedGoal {
    @Id
    @Column(name = "goal_id")
    private UUID goalId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "goal_id")
    private Goal goal;

    @NotNull
    @Column(name = "target_minutes", nullable = false)
    private Integer targetMinutes;

    @NotNull
    @Column(name = "period_days", nullable = false)
    private Integer periodDays;
}
