package nhk.category;

import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

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
}
