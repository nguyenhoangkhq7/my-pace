package nhk.mail;

import nhk.auth.OtpEntity;
import nhk.auth.OtpRepository;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.resend.api-key=re_test_key_12345",
        "spring.resend.from=noreply@mypace.app",
        "JWT_SECRET=test-jwt-secret-with-at-least-256-bits-length-so-it-does-not-fail-validation"
})
class SendOtpMailServiceIntegrationTest {

    @Autowired
    private SendOtpMailService sendOtpMailService;

    @Autowired
    private OtpRepository otpRepository;

    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        otpRepository.deleteAll();
        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.baseUrl("https://api.resend.com").defaultHeader("Authorization", "Bearer re_test_key_12345").build();
        ReflectionTestUtils.setField(sendOtpMailService, "restClient", restClient);
    }

    @Test
    @DisplayName("Integration: Should save OTP in database and send HTTP request to Resend API")
    void sendOtpMail_NewEmail_SavesOtpAndSendsHttpRequest() {
        String email = "integration_new@example.com";
        String otp = "123456";

        mockServer.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer re_test_key_12345"))
                .andExpect(header("Content-Type", MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.from").value("noreply@mypace.app"))
                .andExpect(jsonPath("$.to").value(email))
                .andExpect(jsonPath("$.subject").value("OTP"))
                .andExpect(jsonPath("$.text").value(Matchers.containsString(otp)))
                .andRespond(withSuccess("{\"id\": \"msg_123\"}", MediaType.APPLICATION_JSON));

        sendOtpMailService.sendOtpMail(email, otp);

        mockServer.verify();

        Optional<OtpEntity> otpOptional = otpRepository.findByEmail(email);
        assertThat(otpOptional).isPresent();
        OtpEntity otpEntity = otpOptional.get();
        assertThat(otpEntity.getEmail()).isEqualTo(email);
        assertThat(otpEntity.getOtp()).isEqualTo(otp);
        assertThat(otpEntity.getExpiresAt()).isAfter(LocalDateTime.now());
    }

    @Test
    @DisplayName("Integration: Should update existing OTP in database when sending email again")
    void sendOtpMail_ExistingEmail_UpdatesOtpInDatabase() {
        String email = "integration_exist@example.com";
        OtpEntity initialOtp = new OtpEntity();
        initialOtp.setEmail(email);
        initialOtp.setOtp("000000");
        initialOtp.setExpiresAt(LocalDateTime.now().minusMinutes(10));
        otpRepository.save(initialOtp);

        String newOtp = "654321";

        mockServer.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess());

        sendOtpMailService.sendOtpMail(email, newOtp);

        mockServer.verify();

        Optional<OtpEntity> updatedOptional = otpRepository.findByEmail(email);
        assertThat(updatedOptional).isPresent();
        OtpEntity updatedEntity = updatedOptional.get();
        assertThat(updatedEntity.getOtp()).isEqualTo(newOtp);
        assertThat(updatedEntity.getExpiresAt()).isAfter(LocalDateTime.now());
    }

    @Test
    @DisplayName("Integration: Should throw EmailSendingException when Resend API returns HTTP 500")
    void sendOtpMail_ResendApiError_ThrowsEmailSendingException() {
        String email = "integration_error@example.com";
        String otp = "999999";

        mockServer.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());

        assertThatThrownBy(() -> sendOtpMailService.sendOtpMail(email, otp))
                .isInstanceOf(EmailSendingException.class)
                .hasMessage("Failed to send email");

        mockServer.verify();

        Optional<OtpEntity> savedOptional = otpRepository.findByEmail(email);
        assertThat(savedOptional).isPresent();
        assertThat(savedOptional.get().getOtp()).isEqualTo(otp);
    }
}
