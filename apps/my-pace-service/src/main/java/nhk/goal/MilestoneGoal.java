package nhk.goal;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "milestone_goals")
public class MilestoneGoal {
    @Id
    @Column(name = "goal_id", nullable = false, updatable = false)
    private UUID goalId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "goal_id")
    private Goal goal;

    @NotNull
    @Column(name = "target_count", nullable = false)
    private Integer targetCount;

    @NotNull
    @Column(name = "current_count", nullable = false)
    private Integer currentCount = 0;
}
