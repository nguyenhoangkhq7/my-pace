package nhk.category;

import com.fasterxml.jackson.databind.ObjectMapper;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserDetailsCustom;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private CategoryController categoryController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private UUID userId;
    private UUID categoryId;
    private UserDetailsCustom userDetailsCustom;
    private CategoryDto sampleDto;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        categoryId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setEmail("user@example.com");
        user.setRole(Role.USER);

        userDetailsCustom = new UserDetailsCustom(user);
        sampleDto = new CategoryDto(categoryId, "Work", "#3b82f6", null);
        objectMapper = new ObjectMapper();

        HandlerMethodArgumentResolver authenticationPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                        || parameter.getParameterType().isAssignableFrom(UserDetailsCustom.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return userDetailsCustom;
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(categoryController)
                .setCustomArgumentResolvers(authenticationPrincipalResolver)
                .build();
    }

    @Test
    @DisplayName("GET /api/categories should return 200 OK and list of CategoryDto")
    void getCategories_Success() throws Exception {
        when(categoryService.getCategories(userId)).thenReturn(List.of(sampleDto));

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(categoryId.toString()))
                .andExpect(jsonPath("$[0].name").value("Work"))
                .andExpect(jsonPath("$[0].color").value("#3b82f6"));

        verify(categoryService, times(1)).getCategories(userId);
    }

    @Test
    @DisplayName("POST /api/categories should return 201 Created when request is valid")
    void createCategory_Success() throws Exception {
        CategoryCreateRequest request = new CategoryCreateRequest("Work", "#3b82f6", null);
        when(categoryService.createCategory(any(CategoryCreateRequest.class), eq(userId))).thenReturn(sampleDto);

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(categoryId.toString()))
                .andExpect(jsonPath("$.name").value("Work"))
                .andExpect(jsonPath("$.color").value("#3b82f6"));

        verify(categoryService, times(1)).createCategory(any(CategoryCreateRequest.class), eq(userId));
    }

    @Test
    @DisplayName("POST /api/categories should return 400 Bad Request when name is blank")
    void createCategory_InvalidRequest_Returns400() throws Exception {
        CategoryCreateRequest request = new CategoryCreateRequest("", "#3b82f6", null);

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(categoryService, never()).createCategory(any(), any());
    }

    @Test
    @DisplayName("PUT /api/categories/{id} should return 200 OK when update is successful")
    void updateCategory_Success() throws Exception {
        CategoryUpdateRequest request = new CategoryUpdateRequest("Updated Work", "#ef4444", null);
        CategoryDto updatedDto = new CategoryDto(categoryId, "Updated Work", "#ef4444", null);

        when(categoryService.updateCategory(eq(categoryId), any(CategoryUpdateRequest.class), eq(userId)))
                .thenReturn(updatedDto);

        mockMvc.perform(put("/api/categories/{id}", categoryId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(categoryId.toString()))
                .andExpect(jsonPath("$.name").value("Updated Work"))
                .andExpect(jsonPath("$.color").value("#ef4444"));

        verify(categoryService, times(1)).updateCategory(eq(categoryId), any(CategoryUpdateRequest.class), eq(userId));
    }

    @Test
    @DisplayName("PUT /api/categories/{id} should return 400 Bad Request when name is blank")
    void updateCategory_InvalidRequest_Returns400() throws Exception {
        CategoryUpdateRequest request = new CategoryUpdateRequest("   ", "#ef4444", null);

        mockMvc.perform(put("/api/categories/{id}", categoryId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(categoryService, never()).updateCategory(any(), any(), any());
    }

    @Test
    @DisplayName("DELETE /api/categories/{id} should return 204 No Content")
    void deleteCategory_Success() throws Exception {
        doNothing().when(categoryService).deleteCategory(categoryId, userId);

        mockMvc.perform(delete("/api/categories/{id}", categoryId))
                .andExpect(status().isNoContent());

        verify(categoryService, times(1)).deleteCategory(categoryId, userId);
    }
}
