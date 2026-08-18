package nhk.quickadd;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record QuickAddRequest(
        @NotBlank(message = "Text input is required")
        @Size(max = 300, message = "Text input must not exceed 300 characters")
        String text,
        Boolean forceAi,
        String userTimezone
) {
    public QuickAddRequest(String text) {
        this(text, false, null);
    }

    public QuickAddRequest(String text, Boolean forceAi) {
        this(text, forceAi, null);
    }
}

