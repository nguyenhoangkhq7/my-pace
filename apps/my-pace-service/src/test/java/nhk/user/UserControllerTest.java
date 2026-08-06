package nhk.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private ObjectMapper objectMapper;
    private UUID userId;
    private User sampleUser;
    private UserDetailsCustom userDetailsCustom;
    private UserProfileUpdateRequest updateRequest;
    private UserSimpleResponse userSimpleResponse;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(userId);
        sampleUser.setEmail("test@example.com");
        sampleUser.setFullName("Test User");
        sampleUser.setRole(Role.USER);

        userDetailsCustom = new UserDetailsCustom(sampleUser);

        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        updateRequest = new UserProfileUpdateRequest(
                "Updated Name",
                LocalTime.of(8, 0),
                LocalTime.of(22, 0),
                20,
                "Asia/Ho_Chi_Minh"
        );

        userSimpleResponse = new UserSimpleResponse(
                userId.toString(),
                "Updated Name",
                "test@example.com",
                "USER",
                LocalTime.of(8, 0),
                LocalTime.of(22, 0),
                20,
                "Asia/Ho_Chi_Minh"
        );
    }

    private MockMvc createMockMvcWithPrincipal(UserDetailsCustom principal) {
        HandlerMethodArgumentResolver authPrincipalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                        || parameter.getParameterType().equals(UserDetailsCustom.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return principal;
            }
        };

        return MockMvcBuilders.standaloneSetup(userController)
                .setCustomArgumentResolvers(authPrincipalResolver)
                .build();
    }

    @Nested
    @DisplayName("updateProfile Endpoints")
    class UpdateProfileEndpoints {

        @Test
        @DisplayName("Should return 200 OK and updated profile when authenticated")
        void updateProfile_Authenticated_Success() throws Exception {
            MockMvc mockMvc = createMockMvcWithPrincipal(userDetailsCustom);

            when(userService.updateProfile(eq(userId), any(UserProfileUpdateRequest.class)))
                    .thenReturn(userSimpleResponse);

            mockMvc.perform(put("/api/users/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(userId.toString())))
                    .andExpect(jsonPath("$.name", is("Updated Name")))
                    .andExpect(jsonPath("$.email", is("test@example.com")))
                    .andExpect(jsonPath("$.bufferPct", is(20)));

            verify(userService, times(1)).updateProfile(eq(userId), any(UserProfileUpdateRequest.class));
        }

        @Test
        @DisplayName("Should return 401 Unauthorized when userDetails is null")
        void updateProfile_Unauthenticated_Returns401() throws Exception {
            MockMvc mockMvc = createMockMvcWithPrincipal(null);

            mockMvc.perform(put("/api/users/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateRequest)))
                    .andExpect(status().isUnauthorized());

            verifyNoInteractions(userService);
        }

        @Test
        @DisplayName("Should directly test controller method returning 401 when userDetails is null")
        void updateProfile_DirectCall_NullUserDetails() {
            ResponseEntity<UserSimpleResponse> response = userController.updateProfile(updateRequest, null);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
            assertThat(response.getBody()).isNull();
            verifyNoInteractions(userService);
        }

        @Test
        @DisplayName("Should directly test controller method returning 200 OK when userDetails is valid")
        void updateProfile_DirectCall_Success() {
            when(userService.updateProfile(eq(userId), any(UserProfileUpdateRequest.class)))
                    .thenReturn(userSimpleResponse);

            ResponseEntity<UserSimpleResponse> response = userController.updateProfile(updateRequest, userDetailsCustom);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().name()).isEqualTo("Updated Name");
            verify(userService, times(1)).updateProfile(eq(userId), any(UserProfileUpdateRequest.class));
        }
    }
}
