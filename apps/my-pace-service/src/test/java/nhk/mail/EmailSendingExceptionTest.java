package nhk.mail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EmailSendingExceptionTest {

    @Test
    @DisplayName("Should create EmailSendingException with message")
    void shouldCreateExceptionWithMessage() {
        String errorMessage = "Failed to send email";

        EmailSendingException exception = new EmailSendingException(errorMessage);

        assertThat(exception.getMessage()).isEqualTo(errorMessage);
        assertThat(exception.getCause()).isNull();
    }

    @Test
    @DisplayName("Should create EmailSendingException with message and cause")
    void shouldCreateExceptionWithMessageAndCause() {
        String errorMessage = "Failed to send email";
        Throwable cause = new RuntimeException("Network error");

        EmailSendingException exception = new EmailSendingException(errorMessage, cause);

        assertThat(exception.getMessage()).isEqualTo(errorMessage);
        assertThat(exception.getCause()).isSameAs(cause);
    }
}
