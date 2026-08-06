package nhk.category;

import nhk.common.CategoryNotFoundException;
import nhk.common.TimeContextNotFoundException;
import nhk.goal.GoalRepository;
import nhk.timecontext.TimeContext;
import nhk.timecontext.TimeContextRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CategoryMapper categoryMapper;

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private TimeContextRepository timeContextRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private UUID userId;
    private UUID categoryId;
    private UUID timeContextId;
    private Category sampleCategory;
    private CategoryDto sampleDto;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        categoryId = UUID.randomUUID();
        timeContextId = UUID.randomUUID();

        sampleCategory = new Category();
        sampleCategory.setId(categoryId);
        sampleCategory.setUserId(userId);
        sampleCategory.setName("Work");
        sampleCategory.setColor("#3b82f6");

        sampleDto = new CategoryDto(categoryId, "Work", "#3b82f6", timeContextId);
    }

    @Test
    @DisplayName("getCategories should return list of CategoryDto when categories exist")
    void getCategories_Success() {
        when(categoryRepository.findByUserIdOrderByNameAsc(userId)).thenReturn(List.of(sampleCategory));
        when(categoryMapper.toDto(sampleCategory)).thenReturn(sampleDto);

        List<CategoryDto> result = categoryService.getCategories(userId);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Work", result.get(0).name());
        verify(categoryRepository, times(1)).findByUserIdOrderByNameAsc(userId);
        verify(categoryMapper, times(1)).toDto(sampleCategory);
    }

    @Test
    @DisplayName("getCategories should return empty list when no categories found")
    void getCategories_Empty() {
        when(categoryRepository.findByUserIdOrderByNameAsc(userId)).thenReturn(Collections.emptyList());

        List<CategoryDto> result = categoryService.getCategories(userId);

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(categoryRepository, times(1)).findByUserIdOrderByNameAsc(userId);
        verify(categoryMapper, never()).toDto(any());
    }

    @Test
    @DisplayName("createCategory should create category successfully without timeContextId")
    void createCategory_Success_WithoutTimeContext() {
        CategoryCreateRequest request = new CategoryCreateRequest("Work", "#3b82f6", null);
        Category entityToSave = new Category();
        entityToSave.setName("Work");
        entityToSave.setColor("#3b82f6");

        when(categoryMapper.toEntity(request)).thenReturn(entityToSave);
        when(categoryRepository.save(entityToSave)).thenReturn(sampleCategory);
        when(categoryMapper.toDto(sampleCategory)).thenReturn(sampleDto);

        CategoryDto result = categoryService.createCategory(request, userId);

        assertNotNull(result);
        assertEquals(userId, entityToSave.getUserId());
        assertEquals("#3b82f6", entityToSave.getColor());
        assertNull(entityToSave.getTimeContext());
        verify(categoryRepository, times(1)).save(entityToSave);
    }

    @Test
    @DisplayName("createCategory should fallback to default color #64748b when color is null or blank")
    void createCategory_Success_DefaultColorWhenNullOrBlank() {
        CategoryCreateRequest request = new CategoryCreateRequest("Personal", "   ", null);
        Category entityToSave = new Category();
        entityToSave.setName("Personal");
        entityToSave.setColor("   ");

        when(categoryMapper.toEntity(request)).thenReturn(entityToSave);
        when(categoryRepository.save(entityToSave)).thenReturn(sampleCategory);
        when(categoryMapper.toDto(sampleCategory)).thenReturn(sampleDto);

        CategoryDto result = categoryService.createCategory(request, userId);

        assertNotNull(result);
        assertEquals("#64748b", entityToSave.getColor());
        verify(categoryRepository, times(1)).save(entityToSave);
    }

    @Test
    @DisplayName("createCategory should attach TimeContext when timeContextId is provided and exists")
    void createCategory_Success_WithTimeContext() {
        CategoryCreateRequest request = new CategoryCreateRequest("Study", "#10b981", timeContextId);
        Category entityToSave = new Category();
        entityToSave.setName("Study");
        entityToSave.setColor("#10b981");

        TimeContext timeContext = new TimeContext();
        timeContext.setId(timeContextId);
        timeContext.setUserId(userId);

        when(categoryMapper.toEntity(request)).thenReturn(entityToSave);
        when(timeContextRepository.findByIdAndUserId(timeContextId, userId)).thenReturn(Optional.of(timeContext));
        when(categoryRepository.save(entityToSave)).thenReturn(sampleCategory);
        when(categoryMapper.toDto(sampleCategory)).thenReturn(sampleDto);

        CategoryDto result = categoryService.createCategory(request, userId);

        assertNotNull(result);
        assertEquals(timeContext, entityToSave.getTimeContext());
        verify(timeContextRepository, times(1)).findByIdAndUserId(timeContextId, userId);
        verify(categoryRepository, times(1)).save(entityToSave);
    }

    @Test
    @DisplayName("createCategory should throw TimeContextNotFoundException when timeContextId does not exist")
    void createCategory_TimeContextNotFound_ThrowsException() {
        CategoryCreateRequest request = new CategoryCreateRequest("Study", "#10b981", timeContextId);
        Category entityToSave = new Category();

        when(categoryMapper.toEntity(request)).thenReturn(entityToSave);
        when(timeContextRepository.findByIdAndUserId(timeContextId, userId)).thenReturn(Optional.empty());

        assertThrows(TimeContextNotFoundException.class, () -> categoryService.createCategory(request, userId));
        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateCategory should update name, color and timeContext successfully")
    void updateCategory_Success_AllFields() {
        CategoryUpdateRequest request = new CategoryUpdateRequest("Updated Work", "#ef4444", timeContextId);

        TimeContext timeContext = new TimeContext();
        timeContext.setId(timeContextId);
        timeContext.setUserId(userId);

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(sampleCategory));
        when(timeContextRepository.findByIdAndUserId(timeContextId, userId)).thenReturn(Optional.of(timeContext));
        when(categoryRepository.save(sampleCategory)).thenReturn(sampleCategory);
        when(categoryMapper.toDto(sampleCategory)).thenReturn(sampleDto);

        CategoryDto result = categoryService.updateCategory(categoryId, request, userId);

        assertNotNull(result);
        assertEquals("Updated Work", sampleCategory.getName());
        assertEquals("#ef4444", sampleCategory.getColor());
        assertEquals(timeContext, sampleCategory.getTimeContext());
        verify(categoryRepository, times(1)).save(sampleCategory);
    }

    @Test
    @DisplayName("updateCategory should set timeContext to null when request.timeContextId is null")
    void updateCategory_Success_ClearTimeContext() {
        CategoryUpdateRequest request = new CategoryUpdateRequest("Updated Work", "#ef4444", null);

        TimeContext existingTimeContext = new TimeContext();
        existingTimeContext.setId(timeContextId);
        sampleCategory.setTimeContext(existingTimeContext);

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(sampleCategory));
        when(categoryRepository.save(sampleCategory)).thenReturn(sampleCategory);
        when(categoryMapper.toDto(sampleCategory)).thenReturn(sampleDto);

        CategoryDto result = categoryService.updateCategory(categoryId, request, userId);

        assertNotNull(result);
        assertNull(sampleCategory.getTimeContext());
        verify(categoryRepository, times(1)).save(sampleCategory);
    }

    @Test
    @DisplayName("updateCategory should keep existing color when request color is blank")
    void updateCategory_Success_KeepExistingColorWhenColorBlank() {
        CategoryUpdateRequest request = new CategoryUpdateRequest("Updated Work", "   ", null);

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(sampleCategory));
        when(categoryRepository.save(sampleCategory)).thenReturn(sampleCategory);
        when(categoryMapper.toDto(sampleCategory)).thenReturn(sampleDto);

        CategoryDto result = categoryService.updateCategory(categoryId, request, userId);

        assertNotNull(result);
        assertEquals("#3b82f6", sampleCategory.getColor());
        verify(categoryRepository, times(1)).save(sampleCategory);
    }

    @Test
    @DisplayName("updateCategory should throw CategoryNotFoundException when category id not found")
    void updateCategory_NotFound_ThrowsException() {
        CategoryUpdateRequest request = new CategoryUpdateRequest("Updated Work", "#ef4444", null);

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.empty());

        assertThrows(CategoryNotFoundException.class, () -> categoryService.updateCategory(categoryId, request, userId));
        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateCategory should throw AccessDeniedException when category belongs to another user")
    void updateCategory_AccessDenied_ThrowsException() {
        CategoryUpdateRequest request = new CategoryUpdateRequest("Updated Work", "#ef4444", null);
        UUID anotherUserId = UUID.randomUUID();
        sampleCategory.setUserId(anotherUserId);

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(sampleCategory));

        assertThrows(AccessDeniedException.class, () -> categoryService.updateCategory(categoryId, request, userId));
        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateCategory should throw TimeContextNotFoundException when provided timeContextId does not exist")
    void updateCategory_TimeContextNotFound_ThrowsException() {
        CategoryUpdateRequest request = new CategoryUpdateRequest("Updated Work", "#ef4444", timeContextId);

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(sampleCategory));
        when(timeContextRepository.findByIdAndUserId(timeContextId, userId)).thenReturn(Optional.empty());

        assertThrows(TimeContextNotFoundException.class, () -> categoryService.updateCategory(categoryId, request, userId));
        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("deleteCategory should clear goal reference and delete category successfully")
    void deleteCategory_Success() {
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(sampleCategory));

        categoryService.deleteCategory(categoryId, userId);

        verify(goalRepository, times(1)).clearCategoryId(categoryId);
        verify(categoryRepository, times(1)).delete(sampleCategory);
    }

    @Test
    @DisplayName("deleteCategory should throw CategoryNotFoundException when category id not found")
    void deleteCategory_NotFound_ThrowsException() {
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.empty());

        assertThrows(CategoryNotFoundException.class, () -> categoryService.deleteCategory(categoryId, userId));
        verify(goalRepository, never()).clearCategoryId(any());
        verify(categoryRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteCategory should throw AccessDeniedException when category belongs to another user")
    void deleteCategory_AccessDenied_ThrowsException() {
        UUID anotherUserId = UUID.randomUUID();
        sampleCategory.setUserId(anotherUserId);

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(sampleCategory));

        assertThrows(AccessDeniedException.class, () -> categoryService.deleteCategory(categoryId, userId));
        verify(goalRepository, never()).clearCategoryId(any());
        verify(categoryRepository, never()).delete(any());
    }
}
