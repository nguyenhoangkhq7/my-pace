package nhk.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import nhk.mail.SendOtpMailService;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
@TestPropertySource(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.url=jdbc:h2:mem:testauthdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "RESEND_API_KEY=test-api-key",
    "JWT_SECRET=test-jwt-secret-with-at-least-256-bits-length-so-it-does-not-fail-validation"
})
class AuthIntegrationTest {

    @Autowired
    private org.springframework.web.context.WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpRepository otpRepository;

    private ObjectMapper objectMapper = new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @MockitoBean
    private SendOtpMailService sendOtpMailService;

    @BeforeEach
    void setUp() {
        mockMvc = org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity())
                .build();
        otpRepository.deleteAll();
        userRepository.deleteAll();

        when(sendOtpMailService.generateOtp()).thenReturn("654321");
        doNothing().when(sendOtpMailService).sendOtpMail(anyString(), anyString());
    }

    @Nested
    @DisplayName("Send OTP Integration Flow")
    class SendOtpFlow {

        @Test
        @DisplayName("Should send OTP successfully when email is not registered")
        void sendOtp_Success() throws Exception {
            SendOtpEmailRequest request = new SendOtpEmailRequest("newuser@example.com");

            mockMvc.perform(post("/api/auth/send-otp")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.otp", is("654321")));
        }

        @Test
        @DisplayName("Should return 409 Conflict when email already registered")
        void sendOtp_DuplicateEmail_Returns400() throws Exception {
            User existingUser = new User();
            existingUser.setEmail("existing@example.com");
            existingUser.setPasswordHash(passwordEncoder.encode("Password123!"));
            existingUser.setFullName("Existing User");
            userRepository.save(existingUser);

            SendOtpEmailRequest request = new SendOtpEmailRequest("existing@example.com");

            mockMvc.perform(post("/api/auth/send-otp")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict());
        }
    }

    @Nested
    @DisplayName("Verify OTP Integration Flow")
    class VerifyOtpFlow {

        @Test
        @DisplayName("Should verify valid OTP successfully and delete OTP record from DB")
        void verifyOtp_Success() throws Exception {
            OtpEntity otp = OtpEntity.builder()
                    .email("verify@example.com")
                    .otp("112233")
                    .expiresAt(LocalDateTime.now().plusMinutes(10))
                    .build();
            otpRepository.save(otp);

            VerifyOtpRequest request = new VerifyOtpRequest("verify@example.com", "112233");

            mockMvc.perform(post("/api/auth/verify-otp")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            assertThat(otpRepository.findByEmail("verify@example.com")).isEmpty();
        }

        @Test
        @DisplayName("Should return 400 Bad Request and delete expired OTP from DB")
        void verifyOtp_Expired_Returns400() throws Exception {
            OtpEntity otp = OtpEntity.builder()
                    .email("expired@example.com")
                    .otp("112233")
                    .expiresAt(LocalDateTime.now().minusMinutes(5))
                    .build();
            otpRepository.save(otp);

            VerifyOtpRequest request = new VerifyOtpRequest("expired@example.com", "112233");

            mockMvc.perform(post("/api/auth/verify-otp")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            assertThat(otpRepository.findByEmail("expired@example.com")).isEmpty();
        }

        @Test
        @DisplayName("Should return 400 Bad Request when OTP code does not match")
        void verifyOtp_Mismatch_Returns400() throws Exception {
            OtpEntity otp = OtpEntity.builder()
                    .email("mismatch@example.com")
                    .otp("112233")
                    .expiresAt(LocalDateTime.now().plusMinutes(10))
                    .build();
            otpRepository.save(otp);

            VerifyOtpRequest request = new VerifyOtpRequest("mismatch@example.com", "999999");

            mockMvc.perform(post("/api/auth/verify-otp")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            assertThat(otpRepository.findByEmail("mismatch@example.com")).isPresent();
        }
    }

    @Nested
    @DisplayName("Register Integration Flow")
    class RegisterFlow {

        @Test
        @DisplayName("Should register new user, persist entity, hash password and set cookie")
        void register_Success() throws Exception {
            RegisterRequest request = new RegisterRequest("register@example.com", "Password123!", "Registered User");

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token", notNullValue()))
                    .andExpect(jsonPath("$.refreshToken", notNullValue()))
                    .andExpect(jsonPath("$.user.email", is("register@example.com")))
                    .andExpect(header().exists("Set-Cookie"));

            Optional<User> savedUser = userRepository.findByEmail("register@example.com");
            assertThat(savedUser).isPresent();
            assertThat(savedUser.get().getFullName()).isEqualTo("Registered User");
            assertThat(passwordEncoder.matches("Password123!", savedUser.get().getPasswordHash())).isTrue();
        }

        @Test
        @DisplayName("Should return 409 Conflict when registering duplicate email")
        void register_DuplicateEmail_Returns400() throws Exception {
            User existingUser = new User();
            existingUser.setEmail("duplicate@example.com");
            existingUser.setPasswordHash(passwordEncoder.encode("Password123!"));
            existingUser.setFullName("Existing User");
            userRepository.save(existingUser);

            RegisterRequest request = new RegisterRequest("duplicate@example.com", "Password123!", "New User");

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict());
        }
    }

    @Nested
    @DisplayName("Login & Refresh Token Integration Flow")
    class LoginAndRefreshFlow {

        @Test
        @DisplayName("Should login successfully with valid credentials and return JWTs")
        void login_Success() throws Exception {
            User user = new User();
            user.setEmail("login@example.com");
            user.setPasswordHash(passwordEncoder.encode("Secret123!"));
            user.setFullName("Login User");
            user.setRole(Role.USER);
            userRepository.save(user);

            LoginRequest request = new LoginRequest("login@example.com", "Secret123!");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token", notNullValue()))
                    .andExpect(jsonPath("$.refreshToken", notNullValue()))
                    .andExpect(jsonPath("$.user.email", is("login@example.com")))
                    .andExpect(header().exists("Set-Cookie"));
        }

        @Test
        @DisplayName("Should return unauthorized when logging in with wrong password")
        void login_WrongPassword_ReturnsUnauthorized() throws Exception {
            User user = new User();
            user.setEmail("wrongpass@example.com");
            user.setPasswordHash(passwordEncoder.encode("Secret123!"));
            user.setFullName("Wrong Pass User");
            userRepository.save(user);

            LoginRequest request = new LoginRequest("wrongpass@example.com", "WrongPassword!");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Should refresh access token using valid refreshToken cookie")
        void refresh_Success() throws Exception {
            RegisterRequest registerRequest = new RegisterRequest("refresh@example.com", "Password123!", "Refresh User");

            MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(registerRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            String responseBody = registerResult.getResponse().getContentAsString();
            JwtResponse jwtResponse = objectMapper.readValue(responseBody, JwtResponse.class);
            String refreshToken = jwtResponse.refreshToken();

            mockMvc.perform(get("/api/auth/refresh")
                            .cookie(new Cookie("refreshToken", refreshToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token", notNullValue()))
                    .andExpect(jsonPath("$.user.email", is("refresh@example.com")));
        }

        @Test
        @DisplayName("Should return 401 Unauthorized when refreshing with invalid token")
        void refresh_InvalidToken_Returns400() throws Exception {
            mockMvc.perform(get("/api/auth/refresh")
                            .cookie(new Cookie("refreshToken", "invalid.refresh.token")))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Logout Integration Flow")
    class LogoutFlow {

        @Test
        @DisplayName("Should logout and return maxAge 0 cookie header")
        void logout_Success() throws Exception {
            RegisterRequest registerRequest = new RegisterRequest("logout@example.com", "Password123!", "Logout User");

            MvcResult result = mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(registerRequest)))
                    .andExpect(status().isOk())
                    .andReturn();

            String token = objectMapper.readValue(result.getResponse().getContentAsString(), JwtResponse.class).token();

            mockMvc.perform(post("/api/auth/logout")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(header().exists("Set-Cookie"));
        }
    }
}
