package nhk.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserDetailsCustomTest {

    private User user;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setEmail("admin@example.com");
        user.setPasswordHash("secret_hash");
        user.setRole(Role.ADMIN);
    }

    @Nested
    @DisplayName("UserDetails Interface Methods")
    class UserDetailsInterfaceTests {

        @Test
        @DisplayName("Should return correct granted authority when role is specified")
        void getAuthorities_WithRole() {
            UserDetailsCustom userDetails = new UserDetailsCustom(user);

            Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();

            assertThat(authorities).hasSize(1);
            assertThat(authorities.iterator().next().getAuthority()).isEqualTo("ROLE_ADMIN");
        }

        @Test
        @DisplayName("Should fallback to ROLE_USER authority when user role is null")
        void getAuthorities_NullRole_FallbackToUserRole() {
            user.setRole(null);
            UserDetailsCustom userDetails = new UserDetailsCustom(user);

            Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();

            assertThat(authorities).hasSize(1);
            assertThat(authorities.iterator().next().getAuthority()).isEqualTo("ROLE_USER");
        }

        @Test
        @DisplayName("Should return password hash from user entity")
        void getPassword() {
            UserDetailsCustom userDetails = new UserDetailsCustom(user);

            assertThat(userDetails.getPassword()).isEqualTo("secret_hash");
        }

        @Test
        @DisplayName("Should return email as username when email is non-null")
        void getUsername_NonNullEmail() {
            UserDetailsCustom userDetails = new UserDetailsCustom(user);

            assertThat(userDetails.getUsername()).isEqualTo("admin@example.com");
        }

        @Test
        @DisplayName("Should return empty string as username when email is null")
        void getUsername_NullEmail() {
            user.setEmail(null);
            UserDetailsCustom userDetails = new UserDetailsCustom(user);

            assertThat(userDetails.getUsername()).isEqualTo("");
        }

        @Test
        @DisplayName("Should return underlying User entity via record getter")
        void recordAccessor() {
            UserDetailsCustom userDetails = new UserDetailsCustom(user);

            assertThat(userDetails.user()).isEqualTo(user);
            assertThat(userDetails.user().getId()).isEqualTo(userId);
        }
    }
}
