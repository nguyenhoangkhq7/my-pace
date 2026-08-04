package nhk.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceCustomTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserDetailsServiceCustom userDetailsServiceCustom;

    private User sampleUser;
    private String email;

    @BeforeEach
    void setUp() {
        email = "john.doe@example.com";
        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());
        sampleUser.setEmail(email);
        sampleUser.setPasswordHash("hashed_password");
        sampleUser.setRole(Role.USER);
    }

    @Nested
    @DisplayName("loadUserByUsername Tests")
    class LoadUserByUsernameTests {

        @Test
        @DisplayName("Should return UserDetailsCustom when user is found by email")
        void loadUserByUsername_Success() {
            when(userRepository.findByEmail(email)).thenReturn(Optional.of(sampleUser));

            UserDetails userDetails = userDetailsServiceCustom.loadUserByUsername(email);

            assertThat(userDetails).isNotNull();
            assertThat(userDetails).isInstanceOf(UserDetailsCustom.class);
            assertThat(userDetails.getUsername()).isEqualTo(email);
            assertThat(userDetails.getPassword()).isEqualTo("hashed_password");

            verify(userRepository, times(1)).findByEmail(email);
        }

        @Test
        @DisplayName("Should throw UsernameNotFoundException when email does not exist")
        void loadUserByUsername_NotFound() {
            when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userDetailsServiceCustom.loadUserByUsername(email))
                    .isInstanceOf(UsernameNotFoundException.class)
                    .hasMessage("User not found with email: " + email);

            verify(userRepository, times(1)).findByEmail(email);
        }
    }

    @Nested
    @DisplayName("ExceptionHandler Tests")
    class ExceptionHandlerTests {

        @Test
        @DisplayName("Should handle UsernameNotFoundException and return 404 response")
        void handleUsernameNotFoundException_Returns404() {
            UsernameNotFoundException exception = new UsernameNotFoundException("User not found with email: test@example.com");

            ResponseEntity<String> response = userDetailsServiceCustom.handleUsernameNotFoundException(exception);

            assertThat(response).isNotNull();
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(response.getBody()).isEqualTo("User not found with email: test@example.com");
        }
    }
}
