package nhk.task.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class TaskPriorityConverter implements AttributeConverter<TaskPriority, Byte> {
    @Override
    public Byte convertToDatabaseColumn(TaskPriority attribute) {
        return attribute == null ? null : attribute.getCode();
    }

    @Override
    public TaskPriority convertToEntityAttribute(Byte dbData) {
        return TaskPriority.fromCode(dbData);
    }
}



