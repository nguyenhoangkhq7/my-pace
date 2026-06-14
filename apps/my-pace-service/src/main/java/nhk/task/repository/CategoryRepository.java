package nhk.task.repository;

import nhk.task.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
    List<Category> findAllByUser_IdOrderByNameAsc(Integer userId);

    Optional<Category> findByIdAndUser_Id(Integer id, Integer userId);
}

