package nhk.user;

import nhk.auth.RegisterRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
   UserDto toDto(User user);
   User toEntity(UserDto userDto);
   User toEntity(RegisterRequest registerRequest);
   @Mapping(target = "name", source = "fullName")
   UserSimpleResponse toUserSimpleResponse(User user);
}
