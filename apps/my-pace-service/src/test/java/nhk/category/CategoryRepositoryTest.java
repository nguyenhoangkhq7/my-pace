package nhk.category;

import jakarta.persistence.EntityManager;
import nhk.timecontext.TimeContext;
import nhk.timecontext.TimeContextRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@TestPropertySource(properties = {
    "RESEND_API_KEY=test-api-key",
    "JWT_SECRET=test-jwt-secret-with-at-least-256-bits-length-so-it-does-not-fail-validation",
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class CategoryRepositoryTest {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TimeContextRepository timeContextRepository;

    @Autowired
    private EntityManager entityManager;

    private UUID userAId;
    private UUID userBId;

    @BeforeEach
    void setUp() {
        userAId = UUID.randomUUID();
        userBId = UUID.randomUUID();
    }

    @Test
    @DisplayName("findByUserIdOrderByNameAsc should return categories belonging to specified user sorted by name ascending")
    void findByUserIdOrderByNameAsc_ShouldReturnSortedCategoriesForUser() {
        Category catWork = new Category();
        catWork.setUserId(userAId);
        catWork.setName("Work");
        catWork.setColor("#3b82f6");

        Category catFitness = new Category();
        catFitness.setUserId(userAId);
        catFitness.setName("Fitness");
        catFitness.setColor("#10b981");

        Category catPersonal = new Category();
        catPersonal.setUserId(userAId);
        catPersonal.setName("Personal");
        catPersonal.setColor("#f59e0b");

        Category catUserB = new Category();
        catUserB.setUserId(userBId);
        catUserB.setName("Alpha");
        catUserB.setColor("#64748b");

        categoryRepository.saveAll(List.of(catWork, catFitness, catPersonal, catUserB));
        entityManager.flush();

        List<Category> result = categoryRepository.findByUserIdOrderByNameAsc(userAId);

        assertEquals(3, result.size());
        assertEquals("Fitness", result.get(0).getName());
        assertEquals("Personal", result.get(1).getName());
        assertEquals("Work", result.get(2).getName());
    }

    @Test
    @DisplayName("findByUserIdAndIdIn should return only matching categories belonging to user")
    void findByUserIdAndIdIn_ShouldReturnOnlyCategoriesBelongingToUser() {
        Category catA1 = new Category();
        catA1.setUserId(userAId);
        catA1.setName("Cat A1");

        Category catA2 = new Category();
        catA2.setUserId(userAId);
        catA2.setName("Cat A2");

        Category catB1 = new Category();
        catB1.setUserId(userBId);
        catB1.setName("Cat B1");

        categoryRepository.saveAll(List.of(catA1, catA2, catB1));
        entityManager.flush();

        List<Category> result = categoryRepository.findByUserIdAndIdIn(userAId, List.of(catA1.getId(), catB1.getId()));

        assertEquals(1, result.size());
        assertEquals(catA1.getId(), result.get(0).getId());
    }

    @Test
    @DisplayName("findByUserIdAndTimeContextId should return matching categories for user and timeContextId")
    void findByUserIdAndTimeContextId_ShouldReturnMatchingCategories() {
        TimeContext timeContext = new TimeContext();
        timeContext.setUserId(userAId);
        timeContext.setName("Morning Routine");
        timeContextRepository.save(timeContext);

        Category catLinked = new Category();
        catLinked.setUserId(userAId);
        catLinked.setName("Exercise");
        catLinked.setTimeContext(timeContext);

        Category catUnlinked = new Category();
        catUnlinked.setUserId(userAId);
        catUnlinked.setName("Reading");

        categoryRepository.saveAll(List.of(catLinked, catUnlinked));
        entityManager.flush();

        List<Category> result = categoryRepository.findByUserIdAndTimeContextId(userAId, timeContext.getId());

        assertEquals(1, result.size());
        assertEquals("Exercise", result.get(0).getName());
    }

    @Test
    @DisplayName("clearTimeContextId should set timeContext to null for categories associated with specified timeContextId")
    void clearTimeContextId_ShouldSetTimeContextToNullForMatchingCategories() {
        TimeContext timeContext = new TimeContext();
        timeContext.setUserId(userAId);
        timeContext.setName("Work Hours");
        timeContextRepository.save(timeContext);

        Category cat1 = new Category();
        cat1.setUserId(userAId);
        cat1.setName("Coding");
        cat1.setTimeContext(timeContext);

        Category cat2 = new Category();
        cat2.setUserId(userAId);
        cat2.setName("Meeting");
        cat2.setTimeContext(timeContext);

        categoryRepository.saveAll(List.of(cat1, cat2));
        entityManager.flush();
        entityManager.clear();

        categoryRepository.clearTimeContextId(timeContext.getId());
        entityManager.flush();
        entityManager.clear();

        Category reloadedCat1 = categoryRepository.findById(cat1.getId()).orElseThrow();
        Category reloadedCat2 = categoryRepository.findById(cat2.getId()).orElseThrow();

        assertNull(reloadedCat1.getTimeContext());
        assertNull(reloadedCat2.getTimeContext());
    }

    @Test
    @DisplayName("uniqueConstraint should throw DataIntegrityViolationException when duplicate category name for same user")
    void save_DuplicateNameSameUser_ShouldThrowDataIntegrityViolationException() {
        Category cat1 = new Category();
        cat1.setUserId(userAId);
        cat1.setName("Work");

        categoryRepository.save(cat1);
        entityManager.flush();

        Category cat2 = new Category();
        cat2.setUserId(userAId);
        cat2.setName("Work");

        categoryRepository.save(cat2);

        assertThrows(DataIntegrityViolationException.class, () -> entityManager.flush());
    }

    @Test
    @DisplayName("uniqueConstraint should allow same category name for different users")
    void save_SameNameDifferentUser_ShouldSucceed() {
        Category cat1 = new Category();
        cat1.setUserId(userAId);
        cat1.setName("Work");

        Category cat2 = new Category();
        cat2.setUserId(userBId);
        cat2.setName("Work");

        categoryRepository.saveAll(List.of(cat1, cat2));
        assertDoesNotThrow(() -> entityManager.flush());
    }
}
