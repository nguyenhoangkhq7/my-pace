package nhk.auth;

import nhk.user.User;
import nhk.user.UserDetailsCustom;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public class SecurityUtils {

   public static Optional<User> getCurrentUser() {
      var authentication = SecurityContextHolder.getContext().getAuthentication();
      if(authentication != null && authentication.getPrincipal() instanceof UserDetailsCustom)
         return Optional.of(((UserDetailsCustom) authentication.getPrincipal()).getUser());
      return Optional.empty();
   }

}
