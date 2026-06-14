package nhk.task.entity;

import lombok.Getter;

@Getter
public enum EnergyRequired {
    LOW((byte) 1),
    MEDIUM((byte) 2),
    HIGH((byte) 3);

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



