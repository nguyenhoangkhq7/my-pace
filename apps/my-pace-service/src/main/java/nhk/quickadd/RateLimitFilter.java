package nhk.quickadd;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import nhk.user.UserDetailsCustom;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding window rate limiter for the /api/quick-add endpoint.
 * Limits each user or client IP to MAX_REQUESTS_PER_WINDOW (30 requests/minute).
 */
@Slf4j
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_WINDOW = 30;
    private static final long WINDOW_SECONDS = 60;
    private static final int MAX_TRACKED_CLIENTS = 5000;

    private final ConcurrentHashMap<String, Deque<Long>> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/api/quick-add");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String clientKey = resolveClientKey(request);
        long now = Instant.now().getEpochSecond();

        boolean allowed = checkRateLimit(clientKey, now);
        if (!allowed) {
            log.warn("Rate limit exceeded for QuickAdd client: {}", clientKey);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("""
                {"statusCode":429,"message":"QuickAdd rate limit exceeded (30 requests/min). Please slow down."}
                """);
            return;
        }

        filterChain.doFilter(request, response);
    }

    public boolean checkRateLimit(String clientKey, long now) {
        if (requestCounts.size() > MAX_TRACKED_CLIENTS) {
            requestCounts.clear(); // Safety purge when map grows too large
        }

        Deque<Long> timestamps = requestCounts.computeIfAbsent(clientKey, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            long windowStart = now - WINDOW_SECONDS;
            while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= MAX_REQUESTS_PER_WINDOW) {
                return false;
            }
            timestamps.addLast(now);
            return true;
        }
    }

    public void reset() {
        requestCounts.clear();
    }

    private String resolveClientKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsCustom userDetails && userDetails.user() != null) {
            return "user:" + userDetails.user().getId();
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return "ip:" + xForwardedFor.split(",")[0].trim();
        }
        return "ip:" + request.getRemoteAddr();
    }
}
