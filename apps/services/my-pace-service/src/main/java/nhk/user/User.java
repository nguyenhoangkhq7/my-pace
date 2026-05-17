package nhk.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import nhk.kanban.entity.Context;
import nhk.energy.EnergyCheckin;
import nhk.energy.EnergyProfile;
import nhk.kanban.entity.TimeBlock;
import nhk.kanban.entity.Board;
import nhk.kanban.entity.Task;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   @Column(name = "id", nullable = false)
   private Integer id;

   @Column(name = "email", nullable = false, length = 191)
   private String email;

   @Column(name = "password_hash", nullable = false)
   private String passwordHash;

   @Column(name = "full_name", nullable = false, length = 100)
   private String fullName;

   @Enumerated(EnumType.STRING)
   @Column(name = "role", length = 20)
   private Role role = Role.USER;

   @Column(name = "is_locked")
   private boolean isLocked = false;

   @ColumnDefault("CURRENT_TIMESTAMP")
   @Column(name = "created_at")
   private Instant createdAt;

   @OneToMany(mappedBy = "user")
   private Set<Board> boards = new LinkedHashSet<>();

   @OneToMany(mappedBy = "user")
   private Set<Context> contexts = new LinkedHashSet<>();

   @OneToMany(mappedBy = "user")
   private Set<EnergyCheckin> energyCheckins = new LinkedHashSet<>();

   @OneToMany(mappedBy = "user")
   private Set<EnergyProfile> energyProfiles = new LinkedHashSet<>();

   @OneToMany(mappedBy = "user")
   private Set<Task> tasks = new LinkedHashSet<>();

   @OneToMany(mappedBy = "user")
   private Set<TimeBlock> timeBlocks = new LinkedHashSet<>();

}