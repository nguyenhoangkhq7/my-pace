package nhk.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserMapper;
import nhk.user.UserSimpleResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private JwtConfig jwtConfig;

    @Mock
    private AuthService authService;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AuthController authController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private User sampleUser;
    private UUID userId;
    private UserSimpleResponse userSimpleResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        objectMapper = new ObjectMapper();

        userId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(userId);
        sampleUser.setEmail("controller_user@example.com");
        sampleUser.setFullName("Controller User");
        sampleUser.setRole(Role.USER);

        userSimpleResponse = new UserSimpleResponse(
                userId.toString(), "Controller User", "controller_user@example.com", "USER",
                LocalTime.of(7, 0), LocalTime.of(23, 0), 20, 10, "Asia/Ho_Chi_Minh"
        );
    }

    @Test
    @DisplayName("POST /api/auth/verify-otp should return 200 OK")
    void verifyOtpRegister_Success() throws Exception {
        VerifyOtpRequest request = new VerifyOtpRequest("controller_user@example.com", "123456");
        doNothing().when(authService).verifyOtp(any(VerifyOtpRequest.class));

        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(authService).verifyOtp(any(VerifyOtpRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/send-otp should return 200 OK with SendOtpResponse")
    void sendOtpEmailRegister_Success() throws Exception {
        SendOtpEmailRequest request = new SendOtpEmailRequest("controller_user@example.com");
        SendOtpResponse response = new SendOtpResponse("123456");

        when(authService.sendOtpEmailRegister(any(SendOtpEmailRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.otp").value("123456"));

        verify(authService).sendOtpEmailRegister(any(SendOtpEmailRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/register should return 200 OK with JwtResponse and Set-Cookie")
    void register_Success() throws Exception {
        RegisterRequest request = new RegisterRequest("controller_user@example.com", "Password123!", "Controller User");
        Jwt accessTokenJwt = mock(Jwt.class);
        Jwt refreshTokenJwt = mock(Jwt.class);

        when(authService.registerUser(any(RegisterRequest.class))).thenReturn(sampleUser);
        when(jwtService.generateAccessToken(sampleUser)).thenReturn(accessTokenJwt);
        when(jwtService.generateRefreshToken(sampleUser)).thenReturn(refreshTokenJwt);
        when(accessTokenJwt.toString()).thenReturn("access_token_val");
        when(refreshTokenJwt.toString()).thenReturn("refresh_token_val");
        when(jwtConfig.getRefreshTokenExpiration()).thenReturn(604800);
        when(userMapper.toUserSimpleResponse(sampleUser)).thenReturn(userSimpleResponse);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("access_token_val"))
                .andExpect(jsonPath("$.refreshToken").value("refresh_token_val"))
                .andExpect(jsonPath("$.user.email").value("controller_user@example.com"))
                .andExpect(header().exists("Set-Cookie"));

        verify(authService).registerUser(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("POST /api/auth/login should return 200 OK with JwtResponse and Set-Cookie")
    void login_Success() throws Exception {
        LoginRequest request = new LoginRequest("controller_user@example.com", "Password123!");
        Jwt accessTokenJwt = mock(Jwt.class);
        Jwt refreshTokenJwt = mock(Jwt.class);

        when(authService.loginUser(any(LoginRequest.class))).thenReturn(sampleUser);
        when(jwtService.generateAccessToken(sampleUser)).thenReturn(accessTokenJwt);
        when(jwtService.generateRefreshToken(sampleUser)).thenReturn(refreshTokenJwt);
        when(accessTokenJwt.toString()).thenReturn("access_token_val");
        when(refreshTokenJwt.toString()).thenReturn("refresh_token_val");
        when(jwtConfig.getRefreshTokenExpiration()).thenReturn(604800);
        when(userMapper.toUserSimpleResponse(sampleUser)).thenReturn(userSimpleResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("access_token_val"))
                .andExpect(jsonPath("$.refreshToken").value("refresh_token_val"))
                .andExpect(jsonPath("$.user.email").value("controller_user@example.com"))
                .andExpect(header().exists("Set-Cookie"));

        verify(authService).loginUser(any(LoginRequest.class));
    }

    @Test
    @DisplayName("GET /api/auth/refresh should return 200 OK with refreshed JwtResponse")
    void refresh_Success() throws Exception {
        JwtResponse jwtResponse = new JwtResponse("new_access_token", userSimpleResponse);
        when(authService.refreshToken("some_refresh_token")).thenReturn(jwtResponse);

        mockMvc.perform(get("/api/auth/refresh")
                        .cookie(new Cookie("refreshToken", "some_refresh_token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("new_access_token"))
                .andExpect(jsonPath("$.user.email").value("controller_user@example.com"));

        verify(authService).refreshToken("some_refresh_token");
    }

    @Test
    @DisplayName("POST /api/auth/logout should clear cookie and return 200 OK")
    void logout_Success() throws Exception {
        doNothing().when(authService).logout("bearer_token_val");

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer bearer_token_val"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"));

        verify(authService).logout("bearer_token_val");
    }
}
