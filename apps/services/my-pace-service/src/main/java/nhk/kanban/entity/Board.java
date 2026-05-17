package nhk.kanban.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import nhk.user.User;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "boards")
public class Board {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   @Column(name = "id", nullable = false)
   private Integer id;

   @ManyToOne(fetch = FetchType.LAZY, optional = false)
   @OnDelete(action = OnDeleteAction.CASCADE)
   @JoinColumn(name = "user_id", nullable = false)
   private User user;

   @Column(name = "name", nullable = false, length = 100)
   private String name;

   @Column(name = "created_at")
   private Instant createdAt = Instant.now();

   @OneToMany(mappedBy = "board")
   @OrderBy("position ASC")
   private Set<BoardColumn> boardColumns = new LinkedHashSet<>();
}
