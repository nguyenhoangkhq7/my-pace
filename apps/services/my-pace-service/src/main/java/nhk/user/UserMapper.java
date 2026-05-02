package nhk.user;

import nhk.auth.RegisterRequest;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
   UserDto toDto(User user);
   User toEntity(UserDto userDto);
   User toEntity(RegisterRequest registerRequest);
}
