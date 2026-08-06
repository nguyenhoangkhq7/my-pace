package nhk.timecontext;

import nhk.category.CategoryDto;

import java.util.List;
import java.util.UUID;

public record TimeContextDto(
    UUID id,
    String name,
    List<TimeContextSlotDto> slots,
    List<CategoryDto> categories
) {}
