package nhk.auth;

import io.jsonwebtoken.security.Keys;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import javax.crypto.SecretKey;

@Slf4j
@Configuration
@ConfigurationProperties(prefix = "spring.jwt")
@Data
public class JwtConfig {
   private String secret;
   private int accessTokenExpiration;
   private int refreshTokenExpiration;

   public SecretKey getSecretKey() {
      return Keys.hmacShaKeyFor(secret.getBytes());
   }
}