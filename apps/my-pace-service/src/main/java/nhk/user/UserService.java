package nhk.user;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public User getUserProxy(Integer userId) {
        return userRepository.getReferenceById(userId);
    }
}
