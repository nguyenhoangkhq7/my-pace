package nhk.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@EntityListeners(org.springframework.data.jpa.domain.support.AuditingEntityListener.class)
@Table(name = "users")
public class User {
    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Size(max = 255)
    @NotNull
    @Column(name = "email", nullable = false)
    private String email;

    @Size(max = 255)
    @NotNull
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Size(max = 255)
    @NotNull
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20)
    private Role role = Role.USER;

    @Column(name = "wake_time")
    private LocalTime wakeTime;

    @Column(name = "sleep_time")
    private LocalTime sleepTime;

    @NotNull
    @Column(name = "buffer_pct", nullable = false)
    private Integer bufferPct = 20;

    @NotNull
    @Column(name = "buffer_minutes", nullable = false)
    private Integer bufferMinutes = 10;

    @Size(max = 50)
    @NotNull
    @Column(name = "timezone", nullable = false, length = 50)
    private String timezone = "Asia/Ho_Chi_Minh";

    @Column(name = "created_at", nullable = false, updatable = false)
    @org.springframework.data.annotation.CreatedDate
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @org.springframework.data.annotation.LastModifiedDate
    private OffsetDateTime updatedAt;
}