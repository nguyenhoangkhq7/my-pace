package nhk.kanban.rule;

import nhk.auth.SecurityRules;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

@Component
public class BoardColumnRules implements SecurityRules {
   @Override
   public void configure(AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry registry) {
      registry.requestMatchers("/api/board-columns").authenticated();
      registry.requestMatchers("/api/board-columns/**").authenticated();
   }
}

