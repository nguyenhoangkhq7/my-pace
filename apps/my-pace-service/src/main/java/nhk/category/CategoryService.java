package nhk.category;

import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import nhk.goal.GoalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final GoalRepository goalRepository;

    public List<CategoryDto> getCategories(UserDetailsCustom userDetails) {
        return categoryRepository.findByUserIdOrderByNameAsc(userDetails.user().getId())
                .stream()
                .map(categoryMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryDto createCategory(CategoryCreateRequest request, UserDetailsCustom userDetails) {
        Category category = categoryMapper.toEntity(request);
        category.setUserId(userDetails.user().getId());
        
        if (category.getColor() == null || category.getColor().isBlank()) {
            category.setColor("#64748b");
        }
        
        return categoryMapper.toDto(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDto updateCategory(UUID id, CategoryUpdateRequest request, UserDetailsCustom userDetails) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        
        if (!category.getUserId().equals(userDetails.user().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        
        category.setName(request.getName());
        if (request.getColor() != null && !request.getColor().isBlank()) {
            category.setColor(request.getColor());
        }
        
        return categoryMapper.toDto(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(UUID id, UserDetailsCustom userDetails) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        
        if (!category.getUserId().equals(userDetails.user().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        
        // Clear category reference on goals
        goalRepository.clearCategoryId(id);
        
        // Delete category
        categoryRepository.delete(category);
    }
}
