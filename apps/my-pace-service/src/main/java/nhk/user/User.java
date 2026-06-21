package nhk.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {
    @Id
    @ColumnDefault("uuid_generate_v4()")
    @Column(name = "id", nullable = false)
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
    @ColumnDefault("'USER'")
    @Column(name = "role", length = 20)
    private Role role = Role.USER;

    @Column(name = "wake_time")
    private LocalTime wakeTime;

    @Column(name = "sleep_time")
    private LocalTime sleepTime;

    @NotNull
    @ColumnDefault("20")
    @Column(name = "buffer_pct", nullable = false)
    private Integer bufferPct;

    @Size(max = 50)
    @NotNull
    @ColumnDefault("'Asia/Ho_Chi_Minh'")
    @Column(name = "timezone", nullable = false, length = 50)
    private String timezone;

    @NotNull
    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @NotNull
    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;


}