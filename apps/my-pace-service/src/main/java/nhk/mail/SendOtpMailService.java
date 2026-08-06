package nhk.mail;

import lombok.extern.slf4j.Slf4j;
import nhk.auth.OtpEntity;
import nhk.auth.OtpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@Slf4j
public class SendOtpMailService {
    private final OtpRepository otpRepository;
    private final RestClient restClient;
    private final String apiKey;
    private final String fromEmail;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String OTP_PREFIX = "otp:";
    private static final int OTP_EXPIRED = 5; // minutes

    @Autowired
    public SendOtpMailService(
            OtpRepository otpRepository,
            @Value("${spring.resend.api-key}") String apiKey,
            @Value("${spring.resend.from}") String fromEmail) {
        this(otpRepository, apiKey, fromEmail, RestClient.builder()
                .baseUrl("https://api.resend.com")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build());
    }

    SendOtpMailService(
            OtpRepository otpRepository,
            String apiKey,
            String fromEmail,
            RestClient restClient) {
        this.otpRepository = otpRepository;
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.restClient = restClient;
    }

    public void sendOtpMail(String email, String otp) {
        OtpEntity otpEntity = otpRepository.findByEmail(email).orElse(new OtpEntity());
        otpEntity.setEmail(email);
        otpEntity.setOtp(otp);
        otpEntity.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRED));
        otpRepository.save(otpEntity);

        String text = "Xin chào,\n\nMã OTP của bạn là: " + otp + "\n\nMã này sẽ hết hạn sau " + OTP_EXPIRED + " phút.\n\nTrân trọng.";

        try {
            restClient.post()
                    .uri("/emails")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "from", fromEmail,
                            "to", email,
                            "subject", "OTP",
                            "text", text
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.error("Failed to send OTP email via Resend to {}", email, e);
            throw new EmailSendingException("Failed to send email", e);
        }
    }

    public String generateOtp() {
        int otp = SECURE_RANDOM.nextInt(1_000_000);
        return String.format("%06d", otp);
    }
}
