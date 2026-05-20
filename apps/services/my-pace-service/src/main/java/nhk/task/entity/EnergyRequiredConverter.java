package nhk.task.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class EnergyRequiredConverter implements AttributeConverter<EnergyRequired, Byte> {
    @Override
    public Byte convertToDatabaseColumn(EnergyRequired attribute) {
        return attribute == null ? null : attribute.getCode();
    }

    @Override
    public EnergyRequired convertToEntityAttribute(Byte dbData) {
        return EnergyRequired.fromCode(dbData);
    }
}



