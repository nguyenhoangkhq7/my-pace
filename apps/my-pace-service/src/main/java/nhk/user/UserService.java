package nhk.user;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
@AllArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public User getUserProxy(UUID userId) {
        return userRepository.getReferenceById(userId);
    }
}
