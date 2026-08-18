package nhk.quickadd;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitFilterTest {

    private RateLimitFilter filter;

    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @Mock private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        filter = new RateLimitFilter();
    }

    @Test
    @DisplayName("shouldNotFilter returns true for non-quick-add paths")
    void shouldNotFilter_NonQuickAdd_ReturnsTrue() {
        when(request.getRequestURI()).thenReturn("/api/tasks");
        assertThat(filter.shouldNotFilter(request)).isTrue();
    }

    @Test
    @DisplayName("shouldNotFilter returns false for /api/quick-add paths")
    void shouldNotFilter_QuickAdd_ReturnsFalse() {
        when(request.getRequestURI()).thenReturn("/api/quick-add");
        assertThat(filter.shouldNotFilter(request)).isFalse();

        when(request.getRequestURI()).thenReturn("/api/quick-add/batch");
        assertThat(filter.shouldNotFilter(request)).isFalse();
    }

    @Test
    @DisplayName("Allows up to 30 requests within 1 minute window")
    void checkRateLimit_UnderLimit_Allowed() {
        long now = Instant.now().getEpochSecond();
        String client = "test-client-1";

        for (int i = 0; i < 30; i++) {
            assertThat(filter.checkRateLimit(client, now)).isTrue();
        }

        // 31st request should be rejected
        assertThat(filter.checkRateLimit(client, now)).isFalse();
    }

    @Test
    @DisplayName("Window slides forward after 60 seconds")
    void checkRateLimit_SlidingWindow_Recovers() {
        long t0 = 1000L;
        String client = "test-client-2";

        for (int i = 0; i < 30; i++) {
            assertThat(filter.checkRateLimit(client, t0)).isTrue();
        }
        assertThat(filter.checkRateLimit(client, t0)).isFalse();

        // After 61 seconds
        long t1 = t0 + 61;
        assertThat(filter.checkRateLimit(client, t1)).isTrue();
    }

    @Test
    @DisplayName("doFilterInternal sets HTTP 429 when rate limit exceeded")
    void doFilterInternal_Exceeded_Sets429() throws ServletException, IOException {
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        StringWriter stringWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(stringWriter));

        // Consume 30 permits
        long now = Instant.now().getEpochSecond();
        for (int i = 0; i < 30; i++) {
            filter.checkRateLimit("ip:127.0.0.1", now);
        }

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        verify(filterChain, never()).doFilter(request, response);
        assertThat(stringWriter.toString()).contains("429");
    }
}
