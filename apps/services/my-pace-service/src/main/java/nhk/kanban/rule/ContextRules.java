package nhk.kanban.rule;

import nhk.auth.SecurityRules;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

@Component
public class ContextRules implements SecurityRules {
   @Override
   public void configure(AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry registry) {
      registry.requestMatchers("/api/contexts").authenticated();
      registry.requestMatchers("/api/contexts/**").authenticated();
   }
}

