package nhk.auth;


import lombok.AllArgsConstructor;
import lombok.Data;
import nhk.user.UserSimpleResponse;

@Data
@AllArgsConstructor
public class JwtResponse {
   private String token;
   private UserSimpleResponse user;
}
