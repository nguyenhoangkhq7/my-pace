package nhk.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegisterRequest(
    @NotNull(message = "Email is required")
    @NotBlank(message = "Email is required")
    String email,

    @NotNull(message = "Password is required")
    @NotBlank(message = "Password is required")
    String password,

    @NotNull(message = "Name is required")
    @NotBlank(message = "Name is required")
    String fullName
) {}
