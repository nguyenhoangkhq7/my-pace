package nhk.user;

import nhk.auth.RegisterRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {
   User toEntity(RegisterRequest registerRequest);
   @Mapping(target = "name", source = "fullName")
   UserSimpleResponse toUserSimpleResponse(User user);

   void updateFromUpdateRequest(UserProfileUpdateRequest request, @MappingTarget User user);
}
