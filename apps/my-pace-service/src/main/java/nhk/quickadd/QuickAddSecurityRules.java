package nhk.quickadd;

import nhk.auth.SecurityRules;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

/**
 * Security rules for QuickAdd API.
 * Only permits unauthenticated access in dev/local/test environments for Evals & promptfoo testing.
 * On production (prod profile), require full JWT authentication.
 */
@Component
@Profile({"dev", "local", "test"})
public class QuickAddSecurityRules implements SecurityRules {
    @Override
    public void configure(AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry registry) {
        registry.requestMatchers("/api/quick-add/**").permitAll();
    }
}
