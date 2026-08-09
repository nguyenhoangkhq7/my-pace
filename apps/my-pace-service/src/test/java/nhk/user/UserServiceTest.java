package nhk.user;

import nhk.common.UserNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    private UUID userId;
    private User user;
    private UserProfileUpdateRequest updateRequest;
    private UserSimpleResponse expectedResponse;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setEmail("user@example.com");
        user.setFullName("Original Name");
        user.setRole(Role.USER);

        updateRequest = new UserProfileUpdateRequest(
                "Updated Name",
                LocalTime.of(7, 0),
                LocalTime.of(23, 0),
                25,
                10,
                "Asia/Ho_Chi_Minh"
        );

        expectedResponse = new UserSimpleResponse(
                userId.toString(),
                "Updated Name",
                "user@example.com",
                "USER",
                LocalTime.of(7, 0),
                LocalTime.of(23, 0),
                25,
                10,
                "Asia/Ho_Chi_Minh"
        );
    }

    @Nested
    @DisplayName("updateProfile Tests")
    class UpdateProfileTests {

        @Test
        @DisplayName("Should successfully update user profile when user exists")
        void updateProfile_Success() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            doNothing().when(userMapper).updateFromUpdateRequest(updateRequest, user);
            when(userRepository.save(user)).thenReturn(user);
            when(userMapper.toUserSimpleResponse(user)).thenReturn(expectedResponse);

            UserSimpleResponse response = userService.updateProfile(userId, updateRequest);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(userId.toString());
            assertThat(response.name()).isEqualTo("Updated Name");
            assertThat(response.email()).isEqualTo("user@example.com");
            assertThat(response.bufferPct()).isEqualTo(25);

            verify(userRepository, times(1)).findById(userId);
            verify(userMapper, times(1)).updateFromUpdateRequest(updateRequest, user);
            verify(userRepository, times(1)).save(user);
            verify(userMapper, times(1)).toUserSimpleResponse(user);
        }

        @Test
        @DisplayName("Should throw UserNotFoundException when user does not exist")
        void updateProfile_UserNotFound() {
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.updateProfile(userId, updateRequest))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessage("User not found with ID: " + userId);

            verify(userRepository, times(1)).findById(userId);
            verifyNoInteractions(userMapper);
            verify(userRepository, never()).save(any());
        }
    }
}
