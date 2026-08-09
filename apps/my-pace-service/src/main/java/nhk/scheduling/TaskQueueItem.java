package nhk.scheduling;

import nhk.task.Task;

public class TaskQueueItem {
    public final Task task;
    public int remainingMinutes;
    public final int priorityRank;
    public int partsFilled = 0;
    public String statusWarning;
    public String escalationReason;

    public TaskQueueItem(Task task, int remainingMinutes, int priorityRank, String statusWarning, String escalationReason) {
        this.task = task;
        this.remainingMinutes = remainingMinutes;
        this.priorityRank = priorityRank;
        this.statusWarning = statusWarning;
        this.escalationReason = escalationReason;
    }
}
