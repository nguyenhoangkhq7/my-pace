package nhk.auth;

import jakarta.persistence.EntityNotFoundException;
import nhk.mail.SendOtpMailService;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserMapper;
import nhk.user.UserRepository;
import nhk.user.UserSimpleResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private SendOtpMailService sendOtpMailService;

    @Mock
    private OtpRepository otpRepository;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(userId);
        sampleUser.setEmail("test@example.com");
        sampleUser.setPasswordHash("hashed_password");
        sampleUser.setFullName("Test User");
        sampleUser.setRole(Role.USER);
    }

    @Nested
    @DisplayName("sendOtpEmailRegister Tests")
    class SendOtpEmailRegisterTests {

        @Test
        @DisplayName("Should send OTP successfully when email is not registered")
        void sendOtpEmailRegister_Success() {
            SendOtpEmailRequest request = new SendOtpEmailRequest("test@example.com");
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
            when(sendOtpMailService.generateOtp()).thenReturn("123456");

            SendOtpResponse response = authService.sendOtpEmailRegister(request);

            assertThat(response).isNotNull();
            assertThat(response.otp()).isEqualTo("123456");
            verify(sendOtpMailService).sendOtpMail("test@example.com", "123456");
        }

        @Test
        @DisplayName("Should throw EmailAlreadyRegisteredException when email already exists")
        void sendOtpEmailRegister_EmailAlreadyRegistered_ThrowsException() {
            SendOtpEmailRequest request = new SendOtpEmailRequest("test@example.com");
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> authService.sendOtpEmailRegister(request))
                    .isInstanceOf(EmailAlreadyRegisteredException.class)
                    .hasMessage("Email is already registered");

            verify(sendOtpMailService, never()).sendOtpMail(anyString(), anyString());
        }
    }

    @Nested
    @DisplayName("registerUser Tests")
    class RegisterUserTests {

        @Test
        @DisplayName("Should register user successfully")
        void registerUser_Success() {
            RegisterRequest request = new RegisterRequest("test@example.com", "Password123!", "Test User");
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
            when(userMapper.toEntity(request)).thenReturn(sampleUser);
            when(passwordEncoder.encode("Password123!")).thenReturn("hashed_password");
            when(userRepository.save(sampleUser)).thenReturn(sampleUser);

            User registered = authService.registerUser(request);

            assertThat(registered).isNotNull();
            assertThat(registered.getEmail()).isEqualTo("test@example.com");
            verify(passwordEncoder).encode("Password123!");
            verify(userRepository).save(sampleUser);
        }

        @Test
        @DisplayName("Should throw EmailAlreadyRegisteredException when email exists")
        void registerUser_EmailAlreadyRegistered_ThrowsException() {
            RegisterRequest request = new RegisterRequest("test@example.com", "Password123!", "Test User");
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));

            assertThatThrownBy(() -> authService.registerUser(request))
                    .isInstanceOf(EmailAlreadyRegisteredException.class)
                    .hasMessage("Email is already registered");

            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("loginUser Tests")
    class LoginUserTests {

        @Test
        @DisplayName("Should login successfully with valid credentials")
        void loginUser_Success() {
            LoginRequest request = new LoginRequest("test@example.com", "Password123!");
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));

            User user = authService.loginUser(request);

            assertThat(user).isNotNull();
            assertThat(user.getEmail()).isEqualTo("test@example.com");
            verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        }

        @Test
        @DisplayName("Should throw exception when authentication fails")
        void loginUser_AuthenticationFailed_ThrowsException() {
            LoginRequest request = new LoginRequest("test@example.com", "wrong_pass");
            doThrow(new BadCredentialsException("Bad credentials"))
                    .when(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));

            assertThatThrownBy(() -> authService.loginUser(request))
                    .isInstanceOf(BadCredentialsException.class);

            verify(userRepository, never()).findByEmail(anyString());
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when user authenticated but not found in DB")
        void loginUser_UserNotFound_ThrowsEntityNotFoundException() {
            LoginRequest request = new LoginRequest("test@example.com", "Password123!");
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.loginUser(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessage("User not found with email: test@example.com");
        }
    }

    @Nested
    @DisplayName("refreshToken Tests")
    class RefreshTokenTests {

        @Test
        @DisplayName("Should throw InvalidTokenException when token is null")
        void refreshToken_NullToken_ThrowsInvalidTokenException() {
            assertThatThrownBy(() -> authService.refreshToken(null))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessage("Token is null");
        }

        @Test
        @DisplayName("Should throw InvalidTokenException when token is expired")
        void refreshToken_ExpiredToken_ThrowsInvalidTokenException() {
            Jwt jwt = mock(Jwt.class);
            when(jwtService.parseToken("expired_token")).thenReturn(jwt);
            when(jwt.isExpirated()).thenReturn(true);

            assertThatThrownBy(() -> authService.refreshToken("expired_token"))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessage("Token is expired");
        }

        @Test
        @DisplayName("Should throw InvalidTokenException when user not found")
        void refreshToken_UserNotFound_ThrowsInvalidTokenException() {
            Jwt jwt = mock(Jwt.class);
            when(jwtService.parseToken("valid_token")).thenReturn(jwt);
            when(jwt.isExpirated()).thenReturn(false);
            when(jwt.getUserIdFromToken()).thenReturn(userId);
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.refreshToken("valid_token"))
                    .isInstanceOf(InvalidTokenException.class)
                    .hasMessage("User not found for this token");
        }

        @Test
        @DisplayName("Should return JwtResponse on valid refresh token")
        void refreshToken_Success() {
            Jwt jwt = mock(Jwt.class);
            Jwt newAccessTokenJwt = mock(Jwt.class);
            UserSimpleResponse userSimpleResponse = new UserSimpleResponse(
                    userId.toString(), "Test User", "test@example.com", "USER",
                    LocalTime.of(7, 0), LocalTime.of(23, 0), 20, "Asia/Ho_Chi_Minh"
            );

            when(jwtService.parseToken("valid_token")).thenReturn(jwt);
            when(jwt.isExpirated()).thenReturn(false);
            when(jwt.getUserIdFromToken()).thenReturn(userId);
            when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
            when(jwtService.generateAccessToken(sampleUser)).thenReturn(newAccessTokenJwt);
            when(newAccessTokenJwt.toString()).thenReturn("new_access_token");
            when(userMapper.toUserSimpleResponse(sampleUser)).thenReturn(userSimpleResponse);

            JwtResponse response = authService.refreshToken("valid_token");

            assertThat(response).isNotNull();
            assertThat(response.token()).isEqualTo("new_access_token");
            assertThat(response.user()).isEqualTo(userSimpleResponse);
        }
    }

    @Nested
    @DisplayName("verifyOtp Tests")
    class VerifyOtpTests {

        @Test
        @DisplayName("Should throw InvalidOtpException when OTP entity not found")
        void verifyOtp_OtpNotFound_ThrowsInvalidOtpException() {
            VerifyOtpRequest request = new VerifyOtpRequest("test@example.com", "123456");
            when(otpRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.verifyOtp(request))
                    .isInstanceOf(InvalidOtpException.class)
                    .hasMessage("Invalid OTP");
        }

        @Test
        @DisplayName("Should delete OTP and throw InvalidOtpException when OTP expired")
        void verifyOtp_OtpExpired_DeletesOtpAndThrowsInvalidOtpException() {
            VerifyOtpRequest request = new VerifyOtpRequest("test@example.com", "123456");
            OtpEntity expiredOtp = OtpEntity.builder()
                    .email("test@example.com")
                    .otp("123456")
                    .expiresAt(LocalDateTime.now().minusMinutes(5))
                    .build();

            when(otpRepository.findByEmail("test@example.com")).thenReturn(Optional.of(expiredOtp));

            assertThatThrownBy(() -> authService.verifyOtp(request))
                    .isInstanceOf(InvalidOtpException.class)
                    .hasMessage("OTP is expired");

            verify(otpRepository).delete(expiredOtp);
        }

        @Test
        @DisplayName("Should throw InvalidOtpException when OTP does not match")
        void verifyOtp_OtpMismatch_ThrowsInvalidOtpException() {
            VerifyOtpRequest request = new VerifyOtpRequest("test@example.com", "654321");
            OtpEntity validOtp = OtpEntity.builder()
                    .email("test@example.com")
                    .otp("123456")
                    .expiresAt(LocalDateTime.now().plusMinutes(5))
                    .build();

            when(otpRepository.findByEmail("test@example.com")).thenReturn(Optional.of(validOtp));

            assertThatThrownBy(() -> authService.verifyOtp(request))
                    .isInstanceOf(InvalidOtpException.class)
                    .hasMessage("Invalid OTP");

            verify(otpRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Should verify successfully and delete OTP when valid")
        void verifyOtp_Success() {
            VerifyOtpRequest request = new VerifyOtpRequest("test@example.com", "123456");
            OtpEntity validOtp = OtpEntity.builder()
                    .email("test@example.com")
                    .otp("123456")
                    .expiresAt(LocalDateTime.now().plusMinutes(5))
                    .build();

            when(otpRepository.findByEmail("test@example.com")).thenReturn(Optional.of(validOtp));

            authService.verifyOtp(request);

            verify(otpRepository).delete(validOtp);
        }
    }

    @Nested
    @DisplayName("logout Tests")
    class LogoutTests {

        @Test
        @DisplayName("Should complete logout without error")
        void logout_Success() {
            authService.logout("some_token");
        }
    }
}
