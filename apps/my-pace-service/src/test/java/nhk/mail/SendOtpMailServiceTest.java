package nhk.mail;

import nhk.auth.OtpEntity;
import nhk.auth.OtpRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SendOtpMailServiceTest {

    @Mock
    private OtpRepository otpRepository;

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private RestClient.RequestBodySpec requestBodySpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    private SendOtpMailService sendOtpMailService;

    private static final String API_KEY = "re_123456789";
    private static final String FROM_EMAIL = "noreply@mypace.app";

    @BeforeEach
    void setUp() {
        sendOtpMailService = new SendOtpMailService(otpRepository, API_KEY, FROM_EMAIL, restClient);
    }

    @Nested
    @DisplayName("sendOtpMail Tests")
    class SendOtpMailTests {

        private void setupRestClientMockSuccess() {
            when(restClient.post()).thenReturn(requestBodyUriSpec);
            when(requestBodyUriSpec.uri("/emails")).thenReturn(requestBodySpec);
            when(requestBodySpec.contentType(MediaType.APPLICATION_JSON)).thenReturn(requestBodySpec);
            when(requestBodySpec.body(any(Object.class))).thenReturn(requestBodySpec);
            when(requestBodySpec.retrieve()).thenReturn(responseSpec);
            when(responseSpec.toBodilessEntity()).thenReturn(ResponseEntity.ok().build());
        }

        @Test
        @DisplayName("Should save new OTP entity and send email successfully when OTP does not exist")
        void sendOtpMail_NewOtp_Success() {
            setupRestClientMockSuccess();
            String email = "test@example.com";
            String otp = "123456";

            when(otpRepository.findByEmail(email)).thenReturn(Optional.empty());

            sendOtpMailService.sendOtpMail(email, otp);

            ArgumentCaptor<OtpEntity> captor = ArgumentCaptor.forClass(OtpEntity.class);
            verify(otpRepository).save(captor.capture());

            OtpEntity savedOtp = captor.getValue();
            assertThat(savedOtp.getEmail()).isEqualTo(email);
            assertThat(savedOtp.getOtp()).isEqualTo(otp);
            assertThat(savedOtp.getExpiresAt()).isAfter(LocalDateTime.now());

            ArgumentCaptor<Object> bodyCaptor = ArgumentCaptor.forClass(Object.class);
            verify(requestBodySpec).body(bodyCaptor.capture());
            assertThat(bodyCaptor.getValue()).isInstanceOf(Map.class);

            @SuppressWarnings("unchecked")
            Map<String, String> bodyMap = (Map<String, String>) bodyCaptor.getValue();
            assertThat(bodyMap)
                    .containsEntry("from", FROM_EMAIL)
                    .containsEntry("to", email)
                    .containsEntry("subject", "OTP");
            assertThat(bodyMap.get("text")).contains(otp);
            verify(responseSpec).toBodilessEntity();
        }

        @Test
        @DisplayName("Should update existing OTP entity and send email successfully when OTP exists")
        void sendOtpMail_ExistingOtp_Success() {
            setupRestClientMockSuccess();
            String email = "test@example.com";
            String otp = "654321";

            OtpEntity existingOtp = new OtpEntity();
            existingOtp.setId(UUID.randomUUID());
            existingOtp.setEmail(email);
            existingOtp.setOtp("111111");
            existingOtp.setExpiresAt(LocalDateTime.now().minusMinutes(10));

            when(otpRepository.findByEmail(email)).thenReturn(Optional.of(existingOtp));

            sendOtpMailService.sendOtpMail(email, otp);

            verify(otpRepository).save(existingOtp);
            assertThat(existingOtp.getOtp()).isEqualTo(otp);
            assertThat(existingOtp.getExpiresAt()).isAfter(LocalDateTime.now());

            verify(responseSpec).toBodilessEntity();
        }

        @Test
        @DisplayName("Should throw EmailSendingException when RestClient throws an exception")
        void sendOtpMail_RestClientFails_ThrowsEmailSendingException() {
            String email = "test@example.com";
            String otp = "123456";

            when(otpRepository.findByEmail(email)).thenReturn(Optional.empty());
            when(restClient.post()).thenReturn(requestBodyUriSpec);
            when(requestBodyUriSpec.uri("/emails")).thenReturn(requestBodySpec);
            when(requestBodySpec.contentType(MediaType.APPLICATION_JSON)).thenReturn(requestBodySpec);
            when(requestBodySpec.body(any(Object.class))).thenReturn(requestBodySpec);
            when(requestBodySpec.retrieve()).thenReturn(responseSpec);
            
            RuntimeException rootCause = new RuntimeException("Connection timeout");
            when(responseSpec.toBodilessEntity()).thenThrow(rootCause);

            assertThatThrownBy(() -> sendOtpMailService.sendOtpMail(email, otp))
                    .isInstanceOf(EmailSendingException.class)
                    .hasMessage("Failed to send email")
                    .hasCause(rootCause);

            verify(otpRepository).save(any(OtpEntity.class));
        }
    }

    @Nested
    @DisplayName("generateOtp Tests")
    class GenerateOtpTests {

        @Test
        @DisplayName("Should generate a 6-digit numeric string")
        void generateOtp_ReturnsSixDigitNumericString() {
            String otp = sendOtpMailService.generateOtp();

            assertThat(otp).isNotNull();
            assertThat(otp).hasSize(6);
            assertThat(otp).matches("\\d{6}");
        }

        @Test
        @DisplayName("Should produce valid 6-digit strings across multiple calls")
        void generateOtp_MultipleCalls_ValidFormat() {
            for (int i = 0; i < 100; i++) {
                String otp = sendOtpMailService.generateOtp();
                assertThat(otp).matches("\\d{6}");
            }
        }
    }
}
