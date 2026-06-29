package nhk.auth;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import nhk.user.UserMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
public class AuthController {
   private final JwtService jwtService;
   private final JwtConfig jwtConfig;
   private final AuthService authService;
   private final UserMapper userMapper;

   @PostMapping("/verify-otp")
   public ResponseEntity<?> verifyOtpRegister(@Valid @RequestBody VerifyOtpRequest request) {
      authService.verifyOtp(request);
      return ResponseEntity.ok().build();
   }

   @PostMapping("/send-otp")
   public ResponseEntity<SendOtpResponse> sendOtpEmailRegister(@Valid @RequestBody SendOtpEmailRequest request) {
      SendOtpResponse otp = authService.sendOtpEmailRegister(request);
      return ResponseEntity.ok().body(otp);
   }

   @PostMapping("/register")
   public ResponseEntity<?> register(
           @Valid @RequestBody RegisterRequest request,
           HttpServletResponse response
   ) {
      var user = authService.registerUser(request);
      String accessToken = jwtService.generateAccessToken(user).toString();
      String refreshToken = jwtService.generateRefreshToken(user).toString();
      setRefreshTokenCookie(response, refreshToken);

      return ResponseEntity.ok(new JwtResponse(accessToken, userMapper.toUserSimpleResponse(user)));
   }

   @PostMapping("/login")
   public ResponseEntity<JwtResponse> login(
           @RequestBody LoginRequest request,
           HttpServletResponse response
   ) {
      var user = authService.loginUser(request);

      String accessToken = jwtService.generateAccessToken(user).toString();
      String refreshToken = jwtService.generateRefreshToken(user).toString();
      setRefreshTokenCookie(response, refreshToken);

      return ResponseEntity.ok(new JwtResponse(accessToken, userMapper.toUserSimpleResponse(user)));
   }

   @GetMapping("/refresh")
   public ResponseEntity<JwtResponse> refresh(
           @CookieValue(name = "refreshToken", required = false) String token
   ) {
      var jwtResponse = authService.refreshToken(token);
      return ResponseEntity.ok(jwtResponse);
   }

   @PostMapping("/logout")
   public ResponseEntity<?> logout(
           @RequestHeader(name = "Authorization", required = false) String authHeader,
           HttpServletResponse response
   ) {
       if (authHeader != null && authHeader.startsWith("Bearer ")) {
           String token = authHeader.replace("Bearer ", "");
           authService.logout(token);
       }

       // Clear refresh token cookie
       ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
               .httpOnly(true)
               .secure(true)
               .path("/api/auth/refresh")
               .maxAge(0) // immediately expired
               .sameSite("None")
               .build();
       response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

       return ResponseEntity.ok().build();
   }

   private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
      ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
              .httpOnly(true)
              .secure(true)
              .path("/api/auth/refresh")
              .maxAge(jwtConfig.getRefreshTokenExpiration())
              .sameSite("None")
              .build();

      response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
   }
}