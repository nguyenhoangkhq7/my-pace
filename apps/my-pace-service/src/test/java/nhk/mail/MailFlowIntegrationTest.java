package nhk.mail;

import com.fasterxml.jackson.databind.ObjectMapper;
import nhk.auth.OtpEntity;
import nhk.auth.OtpRepository;
import nhk.auth.SendOtpEmailRequest;
import nhk.auth.VerifyOtpRequest;
import nhk.user.Role;
import nhk.user.User;
import nhk.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.url=jdbc:h2:mem:testmailflowdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.resend.api-key=re_test_key_12345",
        "spring.resend.from=noreply@mypace.app",
        "JWT_SECRET=test-jwt-secret-with-at-least-256-bits-length-so-it-does-not-fail-validation"
})
class MailFlowIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Autowired
    private SendOtpMailService sendOtpMailService;

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        otpRepository.deleteAll();
        userRepository.deleteAll();
        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.baseUrl("https://api.resend.com").defaultHeader("Authorization", "Bearer re_test_key_12345").build();
        ReflectionTestUtils.setField(sendOtpMailService, "restClient", restClient);
    }

    @Test
    @DisplayName("End-to-End Mail Flow: Send OTP via REST API, save to DB, and verify OTP successfully")
    void fullMailOtpFlow_Success() throws Exception {
        String email = "flow_user@example.com";
        SendOtpEmailRequest sendRequest = new SendOtpEmailRequest(email);

        mockServer.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("{\"id\": \"msg_flow_123\"}", MediaType.APPLICATION_JSON));

        // 1. Call POST /api/auth/send-otp
        String responseContent = mockMvc.perform(post("/api/auth/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sendRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.otp").exists())
                .andReturn()
                .getResponse()
                .getContentAsString();

        mockServer.verify();

        // 2. Verify OTP entity exists in database
        Optional<OtpEntity> otpInDb = otpRepository.findByEmail(email);
        assertThat(otpInDb).isPresent();
        String generatedOtp = otpInDb.get().getOtp();

        // 3. Call POST /api/auth/verify-otp
        VerifyOtpRequest verifyRequest = new VerifyOtpRequest(email, generatedOtp);
        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk());

        // 4. Verify OTP is deleted from database after successful verification
        assertThat(otpRepository.findByEmail(email)).isEmpty();
    }

    @Test
    @DisplayName("End-to-End Mail Flow: Send OTP to registered email returns HTTP 409 Conflict")
    void sendOtp_RegisteredEmail_ReturnsConflict() throws Exception {
        String registeredEmail = "registered@example.com";
        User user = new User();
        user.setEmail(registeredEmail);
        user.setPasswordHash("hashed_pass");
        user.setFullName("Existing User");
        user.setRole(Role.USER);
        userRepository.save(user);

        SendOtpEmailRequest sendRequest = new SendOtpEmailRequest(registeredEmail);

        mockMvc.perform(post("/api/auth/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sendRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email is already registered"));
    }

    @Test
    @DisplayName("End-to-End Mail Flow: Verify incorrect OTP returns HTTP 400 Bad Request")
    void verifyOtp_InvalidOtp_ReturnsBadRequest() throws Exception {
        String email = "wrong_otp@example.com";
        OtpEntity otpEntity = new OtpEntity();
        otpEntity.setEmail(email);
        otpEntity.setOtp("123456");
        otpEntity.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        otpRepository.save(otpEntity);

        VerifyOtpRequest verifyRequest = new VerifyOtpRequest(email, "999999");

        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("OTP not exist or not valid in system"));

        // OTP remains in DB for retry
        assertThat(otpRepository.findByEmail(email)).isPresent();
    }

    @Test
    @DisplayName("End-to-End Mail Flow: Verify expired OTP returns HTTP 400 Bad Request and deletes OTP")
    void verifyOtp_ExpiredOtp_ReturnsBadRequest() throws Exception {
        String email = "expired_otp@example.com";
        OtpEntity expiredOtp = new OtpEntity();
        expiredOtp.setEmail(email);
        expiredOtp.setOtp("123456");
        expiredOtp.setExpiresAt(LocalDateTime.now().minusMinutes(5));
        otpRepository.save(expiredOtp);

        VerifyOtpRequest verifyRequest = new VerifyOtpRequest(email, "123456");

        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("OTP not exist or not valid in system"));

        // Expired OTP should be cleaned up from DB
        assertThat(otpRepository.findByEmail(email)).isEmpty();
    }

    @Test
    @DisplayName("End-to-End Mail Flow: Resend API failure returns HTTP 500 Internal Server Error")
    void sendOtp_ResendApiFails_ReturnsInternalServerError() throws Exception {
        String email = "resend_fail@example.com";
        SendOtpEmailRequest sendRequest = new SendOtpEmailRequest(email);

        mockServer.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());

        mockMvc.perform(post("/api/auth/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sendRequest)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("There is error while sending email"));

        mockServer.verify();
    }
}
