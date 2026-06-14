package nhk.task.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nhk.auth.SecurityUtils;
import nhk.task.dto.request.CategoryCreateRequest;
import nhk.task.dto.request.CategoryUpdateRequest;
import nhk.task.dto.response.CategoryResponse;
import nhk.task.entity.Category;
import nhk.task.mapper.CategoryMapper;
import nhk.task.repository.CategoryRepository;
import nhk.user.User;
import nhk.user.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CategoryMapper categoryMapper;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories() {
        User currentUser = getCurrentUser();
        return categoryRepository.findAllByUser_IdOrderByNameAsc(currentUser.getId())
                .stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategory(Integer categoryId) {
        User currentUser = getCurrentUser();
        Category category = categoryRepository.findByIdAndUser_Id(categoryId, currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + categoryId));
        return categoryMapper.toResponse(category);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryCreateRequest request) {
        User currentUser = getCurrentUser();
        Category category = categoryMapper.toEntity(request);
        category.setUser(userRepository.getReferenceById(currentUser.getId()));
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(Integer categoryId, CategoryUpdateRequest request) {
        User currentUser = getCurrentUser();
        Category category = categoryRepository.findByIdAndUser_Id(categoryId, currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + categoryId));
        categoryMapper.updateEntity(request, category);
        category.setUser(userRepository.getReferenceById(currentUser.getId()));
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Integer categoryId) {
        User currentUser = getCurrentUser();
        Category category = categoryRepository.findByIdAndUser_Id(categoryId, currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + categoryId));
        categoryRepository.delete(category);
    }

    private User getCurrentUser() {
        return SecurityUtils.getCurrentUser()
                .orElseThrow(() -> new AccessDeniedException("Unable to resolve current user"));
    }
}



