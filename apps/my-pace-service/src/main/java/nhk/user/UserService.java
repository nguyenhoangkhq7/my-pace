package nhk.user;

import lombok.RequiredArgsConstructor;
import nhk.common.UserNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional
    public UserSimpleResponse updateProfile(UUID userId, UserProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));

        userMapper.updateFromUpdateRequest(request, user);
        User savedUser = userRepository.save(user);

        return userMapper.toUserSimpleResponse(savedUser);
    }
}
