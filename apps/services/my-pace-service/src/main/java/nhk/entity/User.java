package nhk.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
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

   @Column(name = "username", nullable = false, length = 50)
   private String username;

   @Column(name = "email", nullable = false, length = 191)
   private String email;

   @Column(name = "password_hash", nullable = false)
   private String passwordHash;

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