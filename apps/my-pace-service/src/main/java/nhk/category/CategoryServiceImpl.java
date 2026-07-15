package nhk.category;

import lombok.RequiredArgsConstructor;
import nhk.common.CategoryNotFoundException;
import nhk.goal.GoalRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final GoalRepository goalRepository;

    @Override
    public List<CategoryDto> getCategories(UUID userId) {
        return categoryRepository.findByUserIdOrderByNameAsc(userId)
                .stream()
                .map(categoryMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CategoryDto createCategory(CategoryCreateRequest request, UUID userId) {
        Category category = categoryMapper.toEntity(request);
        category.setUserId(userId);
        
        if (category.getColor() == null || category.getColor().isBlank()) {
            category.setColor("#64748b");
        }
        
        return categoryMapper.toDto(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryDto updateCategory(UUID id, CategoryUpdateRequest request, UUID userId) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with ID: " + id));
        
        if (!category.getUserId().equals(userId)) {
            throw new AccessDeniedException("Access denied");
        }
        
        category.setName(request.name());
        if (request.color() != null && !request.color().isBlank()) {
            category.setColor(request.color());
        }
        
        return categoryMapper.toDto(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(UUID id, UUID userId) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with ID: " + id));
        
        if (!category.getUserId().equals(userId)) {
            throw new AccessDeniedException("Access denied");
        }
        
        // Clear category reference on goals
        goalRepository.clearCategoryId(id);
        
        // Delete category
        categoryRepository.delete(category);
    }
}
