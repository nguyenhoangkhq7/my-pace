package nhk.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthFilter jwtAuthFilter;

    private User sampleUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        userId = UUID.randomUUID();
        sampleUser = new User();
        sampleUser.setId(userId);
        sampleUser.setEmail("filter_user@example.com");
        sampleUser.setPasswordHash("hashed_password");
        sampleUser.setRole(Role.USER);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should authenticate user when valid Bearer token provided in Authorization header")
    void doFilterInternal_BearerHeader_ValidToken_AuthenticatesUser() throws ServletException, IOException {
        String token = "valid_bearer_token";
        Jwt jwt = mock(Jwt.class);

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.parseToken(token)).thenReturn(jwt);
        when(jwt.isExpirated()).thenReturn(false);
        when(jwt.getUserIdFromToken()).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("filter_user@example.com");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should authenticate user when valid token provided in accessToken Cookie")
    void doFilterInternal_Cookie_ValidToken_AuthenticatesUser() throws ServletException, IOException {
        String token = "valid_cookie_token";
        Jwt jwt = mock(Jwt.class);
        Cookie cookie = new Cookie("accessToken", token);

        when(request.getHeader("Authorization")).thenReturn(null);
        when(request.getCookies()).thenReturn(new Cookie[]{cookie});
        when(jwtService.parseToken(token)).thenReturn(jwt);
        when(jwt.isExpirated()).thenReturn(false);
        when(jwt.getUserIdFromToken()).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("filter_user@example.com");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should not authenticate when no token is present")
    void doFilterInternal_NoToken_DoesNotAuthenticate() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn(null);
        when(request.getCookies()).thenReturn(null);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verify(jwtService, never()).parseToken(anyString());
    }

    @Test
    @DisplayName("Should not authenticate when token is invalid or malformed")
    void doFilterInternal_InvalidToken_DoesNotAuthenticate() throws ServletException, IOException {
        String token = "invalid_token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.parseToken(token)).thenReturn(null);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verify(userRepository, never()).findById(any());
    }

    @Test
    @DisplayName("Should not authenticate when token is expired")
    void doFilterInternal_ExpiredToken_DoesNotAuthenticate() throws ServletException, IOException {
        String token = "expired_token";
        Jwt jwt = mock(Jwt.class);

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.parseToken(token)).thenReturn(jwt);
        when(jwt.isExpirated()).thenReturn(true);

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verify(userRepository, never()).findById(any());
    }

    @Test
    @DisplayName("Should not authenticate when user is not found in database")
    void doFilterInternal_UserNotFound_DoesNotAuthenticate() throws ServletException, IOException {
        String token = "valid_token_unknown_user";
        Jwt jwt = mock(Jwt.class);

        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.parseToken(token)).thenReturn(jwt);
        when(jwt.isExpirated()).thenReturn(false);
        when(jwt.getUserIdFromToken()).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        jwtAuthFilter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }
}
