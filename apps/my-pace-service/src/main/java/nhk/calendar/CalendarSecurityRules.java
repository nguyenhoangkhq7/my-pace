package nhk.calendar;

import nhk.auth.SecurityRules;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

@Component
public class CalendarSecurityRules implements SecurityRules {

    @Override
    public void configure(
            AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry registry) {
        // All calendar endpoints require authentication (no public access)
        registry.requestMatchers("/api/calendar/**").authenticated();
    }
}
