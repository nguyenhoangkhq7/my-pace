package nhk.timecontext;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.UUID;

public record TimeContextCreateRequest(
    @NotBlank(message = "Name is required")
    String name,

    @Valid
    List<TimeContextSlotDto> slots,

    List<UUID> categoryIds
) {}
