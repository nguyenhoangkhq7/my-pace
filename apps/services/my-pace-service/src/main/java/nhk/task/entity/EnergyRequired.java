package nhk.task.entity;

import lombok.Getter;

@Getter
public enum EnergyRequired {
    VERY_LOW((byte) 1),
    LOW((byte) 2),
    MEDIUM((byte) 3),
    HIGH((byte) 4),
    INTENSE((byte) 5);

    private final byte code;

    EnergyRequired(byte code) {
        this.code = code;
    }

    public static EnergyRequired fromCode(Byte code) {
        if (code == null) {
            return null;
        }

        for (EnergyRequired energyRequired : values()) {
            if (energyRequired.code == code) {
                return energyRequired;
            }
        }

        throw new IllegalArgumentException("Unknown energy required code: " + code);
    }
}



