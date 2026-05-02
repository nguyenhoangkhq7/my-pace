package nhk.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import lombok.AllArgsConstructor;
import nhk.user.User;
import org.springframework.stereotype.Service;
import java.util.Date;

@Service
@AllArgsConstructor
public class JwtService {
   private final JwtConfig jwtConfig;

   public Jwt generateAccessToken(User user) {
      return generateToken(user, jwtConfig.getAccessTokenExpiration());
   }

   public Jwt generateRefreshToken(User user) {
      return generateToken(user, jwtConfig.getRefreshTokenExpiration());
   }

   private Jwt generateToken(User user, long expirationTime) {
      var claims = Jwts.claims()
              .subject(user.getId().toString())
              .issuedAt(new Date())
              .expiration(new Date(System.currentTimeMillis() + 1000 * expirationTime)).build();

      return new Jwt(claims, jwtConfig.getSecretKey());
   }

   public Jwt parseToken(String authToken) {
      try {
         var claims = getClaims(authToken);
         return new Jwt(claims, jwtConfig.getSecretKey());
      } catch (JwtException e) {
         return null;
      }
   }

   private Claims getClaims(String authToken) {
      return Jwts.parser()
              .verifyWith(jwtConfig.getSecretKey())
              .build()
              .parseSignedClaims(authToken)
              .getPayload();
   }
}