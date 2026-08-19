package nhk.planning.insight;

public record BriefingAlert(
    String type,       // "OVERDUE", "DUE_TODAY", "DUE_SOON", "GOAL_BEHIND", "OVERLOADED"
    String severity,   // "critical", "warning", "info"
    String message,
    int count,
    String goalTitle   // nullable — only used for GOAL_BEHIND
) {}
