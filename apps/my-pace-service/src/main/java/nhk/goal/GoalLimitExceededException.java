package nhk.goal;

public class GoalLimitExceededException extends RuntimeException {
    public GoalLimitExceededException(String message) {
        super(message);
    }
}
