package nhk.user;

import lombok.Data;

@Data
public class UserDto {
   public Integer id;
   public String email;
   private String fullName;
}
