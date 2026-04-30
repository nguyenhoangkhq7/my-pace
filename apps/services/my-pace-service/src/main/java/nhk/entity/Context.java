package nhk.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "contexts")
public class Context {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   @Column(name = "id", nullable = false)
   private Integer id;

   @ManyToOne(fetch = FetchType.LAZY, optional = false)
   @OnDelete(action = OnDeleteAction.CASCADE)
   @JoinColumn(name = "user_id", nullable = false)
   private User user;

   @Column(name = "name", nullable = false, length = 50)
   private String name;

   @ColumnDefault("'#3498db'")
   @Column(name = "color_code", length = 7)
   private String colorCode;

   @OneToMany(mappedBy = "context")
   private Set<Task> tasks = new LinkedHashSet<>();

}