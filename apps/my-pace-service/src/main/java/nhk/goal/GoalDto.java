package nhk.goal;

import lombok.Data;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class GoalDto {
    private UUID id;
    private String title;
    private String goalType;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private UUID categoryId;
    private UUID parentGoalId;
    private Integer progressPct;
    private TimeBoxedGoalDto timeBoxedGoal;
    private MilestoneGoalDto milestoneGoal;
}
