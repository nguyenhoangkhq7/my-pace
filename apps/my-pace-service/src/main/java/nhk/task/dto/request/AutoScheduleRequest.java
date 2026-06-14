package nhk.task.dto.request;

import jakarta.validation.constraints.NotNull;

public record AutoScheduleRequest(@NotNull Integer taskId) {
}

