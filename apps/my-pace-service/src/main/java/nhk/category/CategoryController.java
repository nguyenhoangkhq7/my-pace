package nhk.category;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping
    public List<CategoryDto> getCategories(@AuthenticationPrincipal UserDetailsCustom userDetails) {
        return categoryService.getCategories(userDetails);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDto createCategory(@Valid @RequestBody CategoryCreateRequest request,
                                      @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return categoryService.createCategory(request, userDetails);
    }

    @PutMapping("/{id}")
    public CategoryDto updateCategory(@PathVariable UUID id,
                                      @Valid @RequestBody CategoryUpdateRequest request,
                                      @AuthenticationPrincipal UserDetailsCustom userDetails) {
        return categoryService.updateCategory(id, request, userDetails);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable UUID id,
                               @AuthenticationPrincipal UserDetailsCustom userDetails) {
        categoryService.deleteCategory(id, userDetails);
    }
}
