package nhk.kanban;

import nhk.auth.SecurityRules;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

@Component
public class BoardRules implements SecurityRules {
   @Override
   public void configure(
           AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry registry
   ) {
      registry.requestMatchers("/api/board").authenticated();
      registry.requestMatchers("/api/board/**").authenticated();
   }
}
