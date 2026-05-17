package nhk.kanban.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "board_columns")
public class BoardColumn {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   @Column(name = "id", nullable = false)
   private Integer id;

   @ManyToOne(fetch = FetchType.LAZY, optional = false)
   @OnDelete(action = OnDeleteAction.CASCADE)
   @JoinColumn(name = "board_id", nullable = false)
   private Board board;

   @Column(name = "name", nullable = false, length = 50)
   private String name;

   @ColumnDefault("0")
   @Column(name = "position")
   private Integer position;

   @ColumnDefault("CURRENT_TIMESTAMP")
   @Column(name = "created_at")
   private Instant createdAt;

   @OneToMany(mappedBy = "column")
   @OrderBy("position ASC")
   private Set<Task> tasks = new LinkedHashSet<>();
}