package nhk.stickynote;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@EntityListeners(org.springframework.data.jpa.domain.support.AuditingEntityListener.class)
@Table(name = "sticky_notes")
public class StickyNote {
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
    private String title = "Untitled Note";

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content = "";

    @Size(max = 50)
    @NotNull
    @Column(name = "color", nullable = false)
    private String color = "amber";

    @NotNull
    @Column(name = "is_pinned", nullable = false)
    private Boolean isPinned = false;

    @NotNull
    @Column(name = "is_minimized", nullable = false)
    private Boolean isMinimized = false;

    @NotNull
    @Column(name = "is_visible", nullable = false)
    private Boolean isVisible = true;

    @NotNull
    @Column(name = "position_x", nullable = false)
    private Integer positionX = 120;

    @NotNull
    @Column(name = "position_y", nullable = false)
    private Integer positionY = 120;

    @NotNull
    @Column(name = "width", nullable = false)
    private Integer width = 280;

    @NotNull
    @Column(name = "height", nullable = false)
    private Integer height = 280;

    @NotNull
    @Column(name = "z_index", nullable = false)
    private Integer zIndex = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    @org.springframework.data.annotation.CreatedDate
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @org.springframework.data.annotation.LastModifiedDate
    private OffsetDateTime updatedAt;
}
