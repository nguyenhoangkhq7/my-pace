package nhk.category;

import jakarta.persistence.EntityManager;
import nhk.goal.Goal;
import nhk.goal.GoalRepository;
import nhk.timecontext.TimeContext;
import nhk.timecontext.TimeContextRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
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
class CategoryIntegrationTest {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TimeContextRepository timeContextRepository;

    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private EntityManager entityManager;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("createCategory should persist entity in DB and return DTO")
    void createCategory_ShouldPersistInDatabase() {
        CategoryCreateRequest request = new CategoryCreateRequest("Health", "#10b981", null);

        CategoryDto created = categoryService.createCategory(request, userId);

        assertNotNull(created);
        assertNotNull(created.id());
        assertEquals("Health", created.name());
        assertEquals("#10b981", created.color());

        Optional<Category> foundInDb = categoryRepository.findById(created.id());
        assertTrue(foundInDb.isPresent());
        assertEquals(userId, foundInDb.get().getUserId());
        assertEquals("Health", foundInDb.get().getName());
    }

    @Test
    @DisplayName("createCategory with TimeContext should link TimeContext in DB")
    void createCategory_WithTimeContext_ShouldLinkTimeContextInDatabase() {
        TimeContext timeContext = new TimeContext();
        timeContext.setUserId(userId);
        timeContext.setName("Evening Slot");
        timeContextRepository.save(timeContext);
        entityManager.flush();

        CategoryCreateRequest request = new CategoryCreateRequest("Study", "#3b82f6", timeContext.getId());

        CategoryDto created = categoryService.createCategory(request, userId);

        assertNotNull(created);
        assertEquals(timeContext.getId(), created.timeContextId());

        Category foundInDb = categoryRepository.findById(created.id()).orElseThrow();
        assertNotNull(foundInDb.getTimeContext());
        assertEquals(timeContext.getId(), foundInDb.getTimeContext().getId());
    }

    @Test
    @DisplayName("updateCategory should update entity fields in DB")
    void updateCategory_ShouldUpdateFieldsInDatabase() {
        Category category = new Category();
        category.setUserId(userId);
        category.setName("Old Name");
        category.setColor("#000000");
        categoryRepository.save(category);
        entityManager.flush();

        CategoryUpdateRequest updateRequest = new CategoryUpdateRequest("New Name", "#ffffff", null);

        CategoryDto updated = categoryService.updateCategory(category.getId(), updateRequest, userId);

        assertEquals("New Name", updated.name());
        assertEquals("#ffffff", updated.color());

        Category foundInDb = categoryRepository.findById(category.getId()).orElseThrow();
        assertEquals("New Name", foundInDb.getName());
        assertEquals("#ffffff", foundInDb.getColor());
    }

    @Test
    @DisplayName("deleteCategory should unbind categoryId from associated goals and remove category from DB")
    void deleteCategory_ShouldClearGoalReferenceAndRemoveCategoryFromDatabase() {
        Category category = new Category();
        category.setUserId(userId);
        category.setName("Work");
        category.setColor("#3b82f6");
        categoryRepository.save(category);

        Goal goal = new Goal();
        goal.setUserId(userId);
        goal.setTitle("Finish Sprint");
        goal.setGoalType("Milestone");
        goal.setCategoryId(category.getId());
        goalRepository.save(goal);

        entityManager.flush();
        entityManager.clear();

        categoryService.deleteCategory(category.getId(), userId);

        entityManager.flush();
        entityManager.clear();

        Optional<Category> deletedCategory = categoryRepository.findById(category.getId());
        assertTrue(deletedCategory.isEmpty());

        Goal updatedGoal = goalRepository.findById(goal.getId()).orElseThrow();
        assertNull(updatedGoal.getCategoryId());
    }
}
