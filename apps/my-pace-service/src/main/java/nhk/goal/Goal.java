package nhk.goal;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.generator.EventType;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;

@Getter
@Setter
@Entity
@Table(name = "goals")
public class Goal {
    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Size(max = 255)
    @NotNull
    @Column(name = "title", nullable = false)
    private String title;

    @Size(max = 50)
    @NotNull
    @Column(name = "goal_type", nullable = false)
    private String goalType; // 'Time-boxed', 'Milestone', 'Binary'

    @Size(max = 50)
    @NotNull
    @Column(name = "status", nullable = false)
    private String status = "Freeze"; // 'Freeze', 'In Progress', 'Done', 'Archived'

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Generated(event = EventType.INSERT)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    private OffsetDateTime updatedAt;
    
    @OneToOne(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    private TimeBoxedGoal timeBoxedGoal;
    
    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Milestone> milestones = new ArrayList<>();
}
