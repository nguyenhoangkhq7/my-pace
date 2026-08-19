package nhk.planning.insight;

import java.time.LocalDateTime;
import java.util.UUID;

public record BriefingTaskItem(
    UUID id,
    String title,
    Integer estimatedMinutes, // allocated minutes for today
    Integer totalEstimatedMinutes, // full task estimated minutes
    Boolean isUrgent,
    Boolean isImportant,
    String categoryName,
    String categoryColor,
    String goalTitle,
    LocalDateTime dueDate,
    Boolean isMit,
    String taskType,
    Boolean isSplittable,
    Integer maxDailyDuration,
    Boolean fitsToday // whether this task fits within today's available time
) {}
