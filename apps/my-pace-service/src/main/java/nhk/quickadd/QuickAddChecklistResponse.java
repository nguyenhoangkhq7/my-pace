package nhk.quickadd;

public record QuickAddChecklistResponse(
        String title,
        boolean isCompleted,
        int orderIndex
) {}
