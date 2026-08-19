package nhk.quickadd;

import java.util.List;
import java.util.UUID;

public record QuickAddResponse(
        String type,
        String title,
        Integer estimatedMinutes,
        Boolean isUrgent,
        Boolean isImportant,
        String quadrant,
        Integer importanceScore,
        Integer urgencyScore,
        String classificationReason,
        String dueDate,
        String eventDate,
        String startTime,
        String endTime,
        UUID categoryId,
        UUID goalId,
        String notes,
        List<QuickAddChecklistResponse> checklists,
        Boolean isAllDay,
        String recurrenceType,
        List<Integer> recurrenceDaysOfWeek,
        String recurrenceEndDate,
        String plannedStartTime,
        String source
) {}
