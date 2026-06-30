package nhk.category;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nhk.user.UserDetailsCustom;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}
