export function calculateResistanceReduction(damage, resistance, ignoreResistance = 0, ignoreRes = false) {
    const damageBeforeResistance = Math.max(0, damage);
    const cappedIgnoreResistance = Math.min(50, Math.max(0, ignoreResistance));
    const effectiveResistance = ignoreRes
        ? 0
        : Math.max(0, Math.trunc(resistance -
            cappedIgnoreResistance *
                resistance /
                100));
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
