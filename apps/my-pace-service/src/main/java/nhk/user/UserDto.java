package nhk.user;

import java.util.UUID;

public record UserDto(UUID id, String email, String fullName) {
}
