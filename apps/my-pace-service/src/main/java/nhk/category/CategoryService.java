package nhk.category;

import java.util.List;
import java.util.UUID;

public interface CategoryService {
    List<CategoryDto> getCategories(UUID userId);
    CategoryDto createCategory(CategoryCreateRequest request, UUID userId);
    CategoryDto updateCategory(UUID id, CategoryUpdateRequest request, UUID userId);
    void deleteCategory(UUID id, UUID userId);
}
