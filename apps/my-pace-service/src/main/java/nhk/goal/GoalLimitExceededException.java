package nhk.goal;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class GoalLimitExceededException extends RuntimeException {
    public GoalLimitExceededException(String message) {
        super(message);
    }
}
