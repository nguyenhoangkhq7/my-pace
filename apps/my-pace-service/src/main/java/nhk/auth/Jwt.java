package nhk.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.AllArgsConstructor;
import nhk.user.Role;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@AllArgsConstructor
public class Jwt {
   private final Claims claims;
   private final SecretKey secretKey;

   public boolean isExpirated() {
      return claims.getExpiration().before(new Date());
   }

   public UUID getUserIdFromToken() {
      return UUID.fromString(claims.getSubject());
   }
   public Date getExpiration() {
      return claims.getExpiration();
   }
   public String getRoleFromToken() {
      return Role.valueOf(claims.get("role").toString()).name();
   }

   @Override
   public String toString() {
      return Jwts.builder()
              .claims(claims)
              .signWith(secretKey)
              .compact();
   }
}