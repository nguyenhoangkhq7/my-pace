package nhk.task.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nhk.common.ApiResponse;
import nhk.task.dto.request.CategoryCreateRequest;
import nhk.task.dto.request.CategoryUpdateRequest;
import nhk.task.dto.response.CategoryResponse;
import nhk.task.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getCategories()));
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategory(@PathVariable Integer categoryId) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getCategory(categoryId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(categoryService.createCategory(request), 201, "Category created successfully"));
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Integer categoryId,
            @RequestBody CategoryUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.updateCategory(categoryId, request), "Category updated successfully"));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Integer categoryId) {
        categoryService.deleteCategory(categoryId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Category deleted successfully"));
    }
}

