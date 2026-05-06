package nhk.auth;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import nhk.user.UserMapper;
import nhk.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
public class AuthController {
   private final AuthenticationManager manager;
   private final JwtService jwtService;
   private final UserRepository userRepository;
   private final JwtConfig jwtConfig;
   private final UserMapper userMapper;
   private final PasswordEncoder passwordEncoder;

   @PostMapping("/register")
   public ResponseEntity<?> register(
           @Valid @RequestBody RegisterRequest request,
           HttpServletResponse response
   ) {
      var existingUser = userRepository.findByEmail(request.getEmail());
      if(existingUser.isPresent()) {
         return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email is already registered"));
      }
      var user = userMapper.toEntity(request);
      user.setPasswordHash(passwordEncoder.encode(request.password));
      user.setCreatedAt(Instant.now());
      userRepository.save(user);

      String accessToken = jwtService.generateAccessToken(user).toString();
      String refreshToken = jwtService.generateRefreshToken(user).toString();

      setRefreshTokenCookie(response, refreshToken);
      return ResponseEntity.ok(new JwtResponse(accessToken));
   }

   @PostMapping("/login")
   public ResponseEntity<JwtResponse> login(
           @RequestBody LoginRequest request,
           HttpServletResponse response
   ) {
      manager.authenticate(new UsernamePasswordAuthenticationToken(
              request.getEmail(),
              request.getPassword()
      ));

      var user = userRepository.findByEmail(request.getEmail())
              .orElseThrow(() ->
                      new EntityNotFoundException("User not found with email: " + request.getEmail())
              );

      String accessToken = jwtService.generateAccessToken(user).toString();
      String refreshToken = jwtService.generateRefreshToken(user).toString();

      setRefreshTokenCookie(response, refreshToken);
      return ResponseEntity.ok(new JwtResponse(accessToken));
   }

   @PostMapping("/refresh")
   public ResponseEntity<JwtResponse> refresh(
           @CookieValue(name = "refreshToken") String token
   ) {
      var jwt = jwtService.parseToken(token);
      if(jwt.isExpirated()) {
         return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
      }
      Integer id = jwt.getUserIdFromToken();
      var user = userRepository.findById(id).orElseThrow();
      String accessToken = jwtService.generateAccessToken(user).toString();

      return ResponseEntity.ok(new JwtResponse(accessToken));
   }

   @ExceptionHandler(BadCredentialsException.class)
   public ResponseEntity<Void> handleBadCredentialsException () {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
   }

   private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
      var cookie = new Cookie("refreshToken", refreshToken);
      cookie.setHttpOnly(true);
      cookie.setPath("/auth/refresh");
      cookie.setMaxAge(jwtConfig.getRefreshTokenExpiration());
      cookie.setSecure(true);
      response.addCookie(cookie);
   }
}