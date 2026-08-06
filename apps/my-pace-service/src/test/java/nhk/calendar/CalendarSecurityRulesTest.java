package nhk.calendar;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CalendarSecurityRulesTest {

    @Mock
    private AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry registry;

    @Mock
    private AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizedUrl authorizedUrl;

    @InjectMocks
    private CalendarSecurityRules securityRules;

    @Test
    @DisplayName("Should configure /api/calendar/** to require authentication")
    void configure_RequiresAuthentication() {
        when(registry.requestMatchers("/api/calendar/**")).thenReturn(authorizedUrl);

        securityRules.configure(registry);

        verify(registry).requestMatchers("/api/calendar/**");
        verify(authorizedUrl).authenticated();
    }
}
