export function calculateCriticalDamage(damage, criticalRate, isCritical) {
    if (!isCritical) {
        return {
            inputDamage: damage,
            criticalRate,
            multiplier: 1,
            outputDamage: damage,
        };
    }
    const multiplier = 1.4 +
        0.01 * criticalRate;
    const outputDamage = Math.floor(damage * multiplier);
    return {
        inputDamage: damage,
        criticalRate,
        multiplier,
        outputDamage,
    };
}
