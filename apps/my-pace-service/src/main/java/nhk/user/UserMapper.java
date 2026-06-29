package nhk.user;

import nhk.auth.RegisterRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
   User toEntity(RegisterRequest registerRequest);
   @Mapping(target = "name", source = "fullName")
   UserSimpleResponse toUserSimpleResponse(User user);

   void updateFromSetupRequest(UserProfileSetupRequest request, @MappingTarget User user);
}
