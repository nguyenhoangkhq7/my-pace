package nhk.task.entity;

import lombok.Getter;

@Getter
public enum TaskPriority {
    LOW((byte) 1),
    MEDIUM((byte) 2),
    HIGH((byte) 3),
    URGENT((byte) 4);

    private final byte code;

    TaskPriority(byte code) {
        this.code = code;
    }

    public static TaskPriority fromCode(Byte code) {
        if (code == null) {
            return null;
        }

        for (TaskPriority priority : values()) {
            if (priority.code == code) {
                return priority;
            }
        }

        throw new IllegalArgumentException("Unknown task priority code: " + code);
    }
}



