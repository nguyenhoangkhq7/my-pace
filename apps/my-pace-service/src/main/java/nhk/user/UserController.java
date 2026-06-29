package nhk.user;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@AllArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @PutMapping("/profile/setup")
    public ResponseEntity<UserSimpleResponse> updateProfileSetup(
            @Valid @RequestBody UserProfileSetupRequest request,
            @AuthenticationPrincipal UserDetailsCustom userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + userDetails.getUsername()));

        userMapper.updateFromSetupRequest(request, user);
        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(userMapper.toUserSimpleResponse(savedUser));
    }
}
