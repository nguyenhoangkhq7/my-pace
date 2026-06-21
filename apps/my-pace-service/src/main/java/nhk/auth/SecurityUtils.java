package nhk.auth;

import nhk.user.User;
import nhk.user.UserDetailsCustom;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public class SecurityUtils {

   public static Optional<User> getCurrentUser() {
      var authentication = SecurityContextHolder.getContext().getAuthentication();
      if(authentication == null) {
         return Optional.empty();
      }

      Object principal = authentication.getPrincipal();
      if(principal instanceof UserDetailsCustom(User user1)) {
         return Optional.of(user1);
      }
      if(principal instanceof User user) {
         return Optional.of(user);
      }
      return Optional.empty();
   }

}
