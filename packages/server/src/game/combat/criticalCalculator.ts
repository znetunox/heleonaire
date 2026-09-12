export interface CriticalDamageResult {
    inputDamage: number;
    criticalRate: number;
    multiplier: number;
    outputDamage: number;
}

export function calculateCriticalDamage(
    damage: number,
    criticalRate: number,
    isCritical: boolean,
): CriticalDamageResult {
    if (!isCritical) {
        return {
            inputDamage: damage,
            criticalRate,
            multiplier: 1,
            outputDamage: damage,
        };
    }

    const multiplier =
        1.4 +
        0.01 * criticalRate;

    const outputDamage =
        Math.floor(
            damage * multiplier,
        );

    return {
        inputDamage: damage,
        criticalRate,
        multiplier,
        outputDamage,
    };
}