package nhk.user;

import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;

    UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getUserProxy(Integer userId) {
        return userRepository.getReferenceById(userId);
    }
}
