package nhk.auth;

import nhk.user.User;

public interface AuthService {
    SendOtpResponse sendOtpEmailRegister(SendOtpEmailRequest request);
    User registerUser(RegisterRequest request);
    User loginUser(LoginRequest request);
    JwtResponse refreshToken(String token);
    void verifyOtp(VerifyOtpRequest request);
    SendOtpResponse sendOtpForgotPassword(SendOtpEmailRequest request);
    void resetPassword(ResetPasswordRequest request);
    void logout(String token);
}
