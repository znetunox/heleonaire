export function calculateResistanceReduction(damage, resistance) {
    const damageBeforeResistance = Math.max(0, damage);
    const effectiveResistance = Math.max(0, Math.trunc(resistance));
    if (damageBeforeResistance <= 0 ||
        effectiveResistance <= 0) {
        return {
            resistance: Math.trunc(resistance),
            effectiveResistance,
            damageBeforeResistance,
            damageAfterResistance: damageBeforeResistance,
        };
    }
    const reduction = Math.trunc(damageBeforeResistance *
        effectiveResistance /
        (effectiveResistance + 400) *
        0.8);
    const damageAfterResistance = damageBeforeResistance -
        reduction;
    return {
        resistance: Math.trunc(resistance),
        effectiveResistance,
        damageBeforeResistance,
        damageAfterResistance,
    };
}
