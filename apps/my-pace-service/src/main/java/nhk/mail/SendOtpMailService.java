package nhk.mail;

import lombok.AllArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.time.Duration;

@Service
@AllArgsConstructor
public class SendOtpMailService {
    private final StringRedisTemplate redisTemplate;
    private final JavaMailSender mailSender;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String OTP_PREFIX = "otp:";
    private static final int OTP_EXPIRED = 5; // minutes

    public void sendOtpMail(String email, String otp) throws MailException {
        redisTemplate.opsForValue().set(OTP_PREFIX + email, otp, Duration.ofMinutes(OTP_EXPIRED));
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("OTP");
        String text = "Xin chào,\n\nMã OTP của bạn là: " + otp + "\n\nMã này sẽ hết hạn sau " + OTP_EXPIRED + " phút.\n\nTrân trọng.";
        message.setText(text);
        mailSender.send(message);
    }

    public String generateOtp() {
        int otp = SECURE_RANDOM.nextInt(1_000_000);
        return String.format("%06d", otp);
    }
}
