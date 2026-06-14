package nhk.user;


import lombok.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class UserDetailsCustom implements UserDetails {
   private final User user;

   public UserDetailsCustom(User user) {
      this.user = user;
   }

   public User getUser() {
      return user;
   }

   @Override
   @NonNull
   public Collection<? extends GrantedAuthority> getAuthorities() {
      String roleName = (user.getRole() != null) ? user.getRole().name() : Role.USER.name();
      return List.of(new SimpleGrantedAuthority("ROLE_" + roleName));
   }

   @Override
   public @Nullable String getPassword() {
      return user.getPassword();
   }

   @Override
   @NonNull
   public String getUsername() {
      return user.getEmail() != null ? user.getEmail() : "";
   }
}
