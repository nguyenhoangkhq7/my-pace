package nhk.user;

import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.ExceptionHandler;

@Service
@AllArgsConstructor
public class UserDetailsServiceCustom implements UserDetailsService {
   private final UserRepository userRepository;

   @Override
   @NonNull
   public UserDetails loadUserByUsername(@NonNull String userId) throws UsernameNotFoundException {
      return userRepository.findById(Integer.parseInt(userId))
              .map(UserDetailsCustom::new)
              .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
   }

   @ExceptionHandler(UsernameNotFoundException.class)
   public ResponseEntity<String> handleUsernameNotFoundException(UsernameNotFoundException e) {
      return ResponseEntity.status(404).body(e.getMessage());
   }
}
