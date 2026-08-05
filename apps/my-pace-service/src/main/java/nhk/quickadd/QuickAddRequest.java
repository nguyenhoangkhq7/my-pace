package nhk.quickadd;

import jakarta.validation.constraints.NotBlank;

public record QuickAddRequest(
        @NotBlank(message = "Text input is required")
        String text
) {}
