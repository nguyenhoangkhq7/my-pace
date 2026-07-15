package nhk.auth;

import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nhk.mail.SendOtpMailService;
import nhk.user.User;
import nhk.user.UserMapper;
import nhk.user.UserRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Slf4j
@Service
@AllArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final SendOtpMailService sendOtpMailService;
    private final StringRedisTemplate stringRedisTemplate;

    @Override
    public SendOtpResponse sendOtpEmailRegister(SendOtpEmailRequest request) {
        var user = userRepository.findByEmail(request.email());
        if (user.isPresent()) {
            throw new EmailAlreadyRegisteredException("Email is already registered");
        }
        String otp = sendOtpMailService.generateOtp();
        sendOtpMailService.sendOtpMail(request.email(), otp);
        return new SendOtpResponse(otp);
    }

    @Override
    public User registerUser(RegisterRequest request) {
        var existingUser = userRepository.findByEmail(request.email());
        if(existingUser.isPresent()) {
            throw new EmailAlreadyRegisteredException("Email is already registered");
        }
        var user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        return userRepository.save(user);
    }

    @Override
    public User loginUser(LoginRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                request.email(),
                request.password()
          ));

        return userRepository.findByEmail(request.email())
                .orElseThrow(() ->
                        new EntityNotFoundException("User not found with email: " + request.email())
                );
    }

    @Override
    public JwtResponse refreshToken(String token) {
        if(token == null) {
            throw new InvalidTokenException("Token is null");
        }
        var jwt = jwtService.parseToken(token);
        if(jwt.isExpirated()) {
            throw new InvalidTokenException("Token is expired");
        }
        UUID id = jwt.getUserIdFromToken();
        var user = userRepository.findById(id)
                .orElseThrow(() -> new InvalidTokenException("User not found for this token"));
        String newAccessToken = jwtService.generateAccessToken(user).toString();
        return new JwtResponse(newAccessToken, userMapper.toUserSimpleResponse(user));
    }

    @Override
    public void verifyOtp(VerifyOtpRequest request) {
       String otpRedis = stringRedisTemplate.opsForValue().get("otp:" + request.email());
          if(otpRedis == null || !otpRedis.equals(request.otp())) {
              throw new InvalidOtpException("Invalid OTP");
          }
          stringRedisTemplate.delete("otp:" + request.email());
     }

    @Override
    public void logout(String token) {
        var jwt = jwtService.parseToken(token);
        if (jwt != null && !jwt.isExpirated()) {
            java.util.Date expiration = jwt.getExpiration();
            long remainingMillis = expiration.getTime() - System.currentTimeMillis();
            if (remainingMillis > 0) {
                stringRedisTemplate.opsForValue().set(
                    "blacklist:token:" + token,
                    "true",
                    java.time.Duration.ofMillis(remainingMillis)
                );
            }
        }
    }
}
