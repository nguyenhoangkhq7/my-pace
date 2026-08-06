package nhk.auth;

import io.jsonwebtoken.security.Keys;
import nhk.user.Role;
import nhk.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    @Mock
    private JwtConfig jwtConfig;

    @InjectMocks
    private JwtService jwtService;

    private User sampleUser;
    private UUID userId;
    private SecretKey secretKey;
    private final String secretString = "my_super_secret_key_for_jwt_testing_must_be_long_enough_32bytes";

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(userId);
        sampleUser.setEmail("jwt_user@example.com");
        sampleUser.setRole(Role.USER);

        secretKey = Keys.hmacShaKeyFor(secretString.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("Should generate valid access token")
    void generateAccessToken_Success() {
        when(jwtConfig.getAccessTokenExpiration()).thenReturn(3600); // 1 hour
        when(jwtConfig.getSecretKey()).thenReturn(secretKey);

        Jwt jwt = jwtService.generateAccessToken(sampleUser);

        assertThat(jwt).isNotNull();
        assertThat(jwt.getUserIdFromToken()).isEqualTo(userId);
        assertThat(jwt.getRoleFromToken()).isEqualTo("USER");
        assertThat(jwt.isExpirated()).isFalse();

        String tokenString = jwt.toString();
        assertThat(tokenString).isNotBlank();
    }

    @Test
    @DisplayName("Should generate valid refresh token")
    void generateRefreshToken_Success() {
        when(jwtConfig.getRefreshTokenExpiration()).thenReturn(604800); // 7 days
        when(jwtConfig.getSecretKey()).thenReturn(secretKey);

        Jwt jwt = jwtService.generateRefreshToken(sampleUser);

        assertThat(jwt).isNotNull();
        assertThat(jwt.getUserIdFromToken()).isEqualTo(userId);
        assertThat(jwt.isExpirated()).isFalse();
    }

    @Test
    @DisplayName("Should parse valid token string")
    void parseToken_ValidToken_ReturnsJwt() {
        when(jwtConfig.getAccessTokenExpiration()).thenReturn(3600);
        when(jwtConfig.getSecretKey()).thenReturn(secretKey);

        Jwt generatedJwt = jwtService.generateAccessToken(sampleUser);
        String tokenString = generatedJwt.toString();

        Jwt parsedJwt = jwtService.parseToken(tokenString);

        assertThat(parsedJwt).isNotNull();
        assertThat(parsedJwt.getUserIdFromToken()).isEqualTo(userId);
        assertThat(parsedJwt.getRoleFromToken()).isEqualTo("USER");
    }

    @Test
    @DisplayName("Should return null when parsing invalid or malformed token")
    void parseToken_InvalidToken_ReturnsNull() {
        when(jwtConfig.getSecretKey()).thenReturn(secretKey);

        Jwt parsedJwt = jwtService.parseToken("invalid.jwt.token");

        assertThat(parsedJwt).isNull();
    }
}
