package nhk.auth;

import nhk.user.User;

public interface AuthService {
    SendOtpResponse sendOtpEmailRegister(SendOtpEmailRequest request);
    User registerUser(RegisterRequest request);
    User loginUser(LoginRequest request);
    JwtResponse refreshToken(String token);
    void verifyOtp(VerifyOtpRequest request);
    void logout(String token);
}
