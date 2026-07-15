package nhk.auth;

import lombok.Builder;
import nhk.user.UserSimpleResponse;

@Builder
public record JwtResponse(
    String token,
    String refreshToken,
    UserSimpleResponse user
) {
    public JwtResponse(String token, UserSimpleResponse user) {
        this(token, null, user);
    }
}
