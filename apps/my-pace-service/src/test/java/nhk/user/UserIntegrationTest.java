package nhk.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import nhk.common.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.context.NestedTestConfiguration;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@NestedTestConfiguration(NestedTestConfiguration.EnclosingConfiguration.INHERIT)
@TestPropertySource(properties = {
    "RESEND_API_KEY=test-api-key",
    "JWT_SECRET=test-jwt-secret-with-at-least-256-bits-length-so-it-does-not-fail-validation"
})
class UserIntegrationTest {

    @Autowired
    private UserController userController;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDetailsServiceCustom userDetailsServiceCustom;

    private ObjectMapper objectMapper;

    private User testUser;
    private UserDetailsCustom userDetailsCustom;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        testUser = new User();
        testUser.setEmail("integration.test@example.com");
        testUser.setPasswordHash("hashed_password_123");
        testUser.setFullName("Initial Integration Name");
        testUser.setRole(Role.USER);
        testUser.setWakeTime(LocalTime.of(6, 30));
        testUser.setSleepTime(LocalTime.of(22, 30));
        testUser.setBufferPct(15);
        testUser.setTimezone("Asia/Ho_Chi_Minh");

        testUser = userRepository.save(testUser);
        userDetailsCustom = new UserDetailsCustom(testUser);
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
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(authPrincipalResolver)
                .build();
    }

    @Nested
    @DisplayName("User Profile Update API & DB Integration")
    class ProfileUpdateIntegration {

        @Test
        @DisplayName("Should successfully update profile via API and persist changes to database")
        void updateProfile_FullFlow_Success() throws Exception {
            MockMvc mockMvc = createMockMvcWithPrincipal(userDetailsCustom);

            UserProfileUpdateRequest request = new UserProfileUpdateRequest(
                    "Updated Integration Name",
                    LocalTime.of(7, 30),
                    LocalTime.of(23, 30),
                    25,
                    "Asia/Tokyo"
            );

            // 1. Perform HTTP PUT update
            mockMvc.perform(put("/api/users/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id", is(testUser.getId().toString())))
                    .andExpect(jsonPath("$.name", is("Updated Integration Name")))
                    .andExpect(jsonPath("$.email", is("integration.test@example.com")))
                    .andExpect(jsonPath("$.wakeTime", is("07:30:00")))
                    .andExpect(jsonPath("$.sleepTime", is("23:30:00")))
                    .andExpect(jsonPath("$.bufferPct", is(25)))
                    .andExpect(jsonPath("$.timezone", is("Asia/Tokyo")));

            // 2. Verify state in Database
            User dbUser = userRepository.findById(testUser.getId()).orElseThrow();
            assertThat(dbUser.getFullName()).isEqualTo("Updated Integration Name");
            assertThat(dbUser.getWakeTime()).isEqualTo(LocalTime.of(7, 30));
            assertThat(dbUser.getSleepTime()).isEqualTo(LocalTime.of(23, 30));
            assertThat(dbUser.getBufferPct()).isEqualTo(25);
            assertThat(dbUser.getTimezone()).isEqualTo("Asia/Tokyo");
        }

        @Test
        @DisplayName("Should return 404 Not Found when updating profile for non-existent user ID")
        void updateProfile_UserNotFound() throws Exception {
            User nonExistentUser = new User();
            nonExistentUser.setId(UUID.randomUUID());
            nonExistentUser.setEmail("ghost@example.com");
            nonExistentUser.setRole(Role.USER);

            UserDetailsCustom ghostUserDetails = new UserDetailsCustom(nonExistentUser);
            MockMvc mockMvc = createMockMvcWithPrincipal(ghostUserDetails);

            UserProfileUpdateRequest request = new UserProfileUpdateRequest(
                    "Ghost User",
                    LocalTime.of(7, 0),
                    LocalTime.of(23, 0),
                    20,
                    "Asia/Ho_Chi_Minh"
            );

            mockMvc.perform(put("/api/users/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message", is("User not found with ID: " + nonExistentUser.getId())));
        }

        @Test
        @DisplayName("Should return 401 Unauthorized when principal is null")
        void updateProfile_Unauthenticated() throws Exception {
            MockMvc mockMvc = createMockMvcWithPrincipal(null);

            UserProfileUpdateRequest request = new UserProfileUpdateRequest(
                    "Ghost User",
                    LocalTime.of(7, 0),
                    LocalTime.of(23, 0),
                    20,
                    "Asia/Ho_Chi_Minh"
            );

            mockMvc.perform(put("/api/users/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Validation Constraints Integration Tests")
    class ValidationIntegration {

        @Test
        @DisplayName("Should return 400 Bad Request when bufferPct is less than 10%")
        void updateProfile_BufferPctTooLow_Returns400() throws Exception {
            MockMvc mockMvc = createMockMvcWithPrincipal(userDetailsCustom);

            UserProfileUpdateRequest request = new UserProfileUpdateRequest(
                    "Name", LocalTime.of(7, 0), LocalTime.of(23, 0), 5, "Asia/Ho_Chi_Minh"
            );

            mockMvc.perform(put("/api/users/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 Bad Request when bufferPct is greater than 30%")
        void updateProfile_BufferPctTooHigh_Returns400() throws Exception {
            MockMvc mockMvc = createMockMvcWithPrincipal(userDetailsCustom);

            UserProfileUpdateRequest request = new UserProfileUpdateRequest(
                    "Name", LocalTime.of(7, 0), LocalTime.of(23, 0), 35, "Asia/Ho_Chi_Minh"
            );

            mockMvc.perform(put("/api/users/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 Bad Request when wakeTime is null")
        void updateProfile_NullWakeTime_Returns400() throws Exception {
            MockMvc mockMvc = createMockMvcWithPrincipal(userDetailsCustom);

            UserProfileUpdateRequest request = new UserProfileUpdateRequest(
                    "Name", null, LocalTime.of(23, 0), 20, "Asia/Ho_Chi_Minh"
            );

            mockMvc.perform(put("/api/users/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 Bad Request when sleepTime is null")
        void updateProfile_NullSleepTime_Returns400() throws Exception {
            MockMvc mockMvc = createMockMvcWithPrincipal(userDetailsCustom);

            UserProfileUpdateRequest request = new UserProfileUpdateRequest(
                    "Name", LocalTime.of(7, 0), null, 20, "Asia/Ho_Chi_Minh"
            );

            mockMvc.perform(put("/api/users/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 Bad Request when bufferPct is null")
        void updateProfile_NullBufferPct_Returns400() throws Exception {
            MockMvc mockMvc = createMockMvcWithPrincipal(userDetailsCustom);

            UserProfileUpdateRequest request = new UserProfileUpdateRequest(
                    "Name", LocalTime.of(7, 0), LocalTime.of(23, 0), null, "Asia/Ho_Chi_Minh"
            );

            mockMvc.perform(put("/api/users/profile")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("UserRepository & UserDetailsService DB Integration")
    class DataRepositoryAndDetailsServiceIntegration {

        @Test
        @DisplayName("Should find saved user by email in UserRepository")
        void findByEmail_Success() {
            Optional<User> foundUser = userRepository.findByEmail("integration.test@example.com");

            assertTrue(foundUser.isPresent());
            assertThat(foundUser.get().getId()).isEqualTo(testUser.getId());
            assertThat(foundUser.get().getFullName()).isEqualTo("Initial Integration Name");
        }

        @Test
        @DisplayName("Should return empty optional when querying non-existent email in UserRepository")
        void findByEmail_NotFound() {
            Optional<User> foundUser = userRepository.findByEmail("nonexistent@example.com");

            assertTrue(foundUser.isEmpty());
        }

        @Test
        @DisplayName("UserDetailsServiceCustom should load UserDetails from real database")
        void loadUserByUsername_Success() {
            UserDetails userDetails = userDetailsServiceCustom.loadUserByUsername("integration.test@example.com");

            assertNotNull(userDetails);
            assertThat(userDetails.getUsername()).isEqualTo("integration.test@example.com");
            assertThat(userDetails.getAuthorities()).extracting("authority").containsExactly("ROLE_USER");
        }

        @Test
        @DisplayName("UserDetailsServiceCustom should throw UsernameNotFoundException for unregistered email")
        void loadUserByUsername_NotFound() {
            assertThatThrownBy(() -> userDetailsServiceCustom.loadUserByUsername("unknown@example.com"))
                    .isInstanceOf(UsernameNotFoundException.class)
                    .hasMessage("User not found with email: unknown@example.com");
        }
    }
}
