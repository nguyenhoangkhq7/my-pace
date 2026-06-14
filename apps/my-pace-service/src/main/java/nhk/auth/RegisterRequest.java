package nhk.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterRequest {
   @NotNull( message = "Email is required")
   @NotBlank( message = "Email is required")
   public String email;
   @NotNull( message = "Password is required")
   @NotBlank( message = "Password is required")
   public String password;
   @NotNull( message = "Name is required")
   @NotBlank( message = "Name is required")
   public String fullName;
}
