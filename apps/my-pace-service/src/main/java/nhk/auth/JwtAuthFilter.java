package nhk.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import nhk.user.UserDetailsCustom;
import nhk.user.UserRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@AllArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
   private final JwtService jwtService;
   private final UserRepository userRepository;
   private final StringRedisTemplate stringRedisTemplate;

   @Override
   protected void doFilterInternal(HttpServletRequest request, @NonNull HttpServletResponse response,@NonNull FilterChain filterChain) throws ServletException, IOException {
      String authHeader = request.getHeader("Authorization");
      if(authHeader==null || !authHeader.startsWith("Bearer ")) {
         filterChain.doFilter(request, response);
         return;
      }
      String token = authHeader.replace("Bearer ", "");
      Jwt jwt = jwtService.parseToken(token);
      if(jwt == null || jwt.isExpirated()) {
         filterChain.doFilter(request, response);
         return;
      }

      // Check if token is blacklisted in Redis
      Boolean isBlacklisted = stringRedisTemplate.hasKey("blacklist:token:" + token);
      if (Boolean.TRUE.equals(isBlacklisted)) {
         filterChain.doFilter(request, response);
         return;
      }

      userRepository.findById(jwt.getUserIdFromToken()).ifPresent(user -> {
         var userDetails = new UserDetailsCustom(user);
         var authentication = new UsernamePasswordAuthenticationToken(
                 userDetails,
                 null,
                 userDetails.getAuthorities()
         );
         authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
         SecurityContextHolder.getContext().setAuthentication(authentication);
      });
      filterChain.doFilter(request, response);
   }
}