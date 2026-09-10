export interface ResistanceResult {
    resistance: number;
    effectiveResistance: number;
    damageBeforeResistance: number;
    damageAfterResistance: number;
}

export function calculateResistanceReduction(
    damage: number,
    resistance: number,
): ResistanceResult {
    const damageBeforeResistance =
        Math.max(0, damage);

    const effectiveResistance =
        Math.max(0, Math.trunc(resistance));

    if (
        damageBeforeResistance <= 0 ||
        effectiveResistance <= 0
    ) {
        return {
            resistance: Math.trunc(resistance),
            effectiveResistance,
            damageBeforeResistance,
            damageAfterResistance:
                damageBeforeResistance,
        };
    }

    const reduction =
        effectiveResistance /
        (effectiveResistance + 400) *
        0.8;

    const damageAfterResistance =
        damageBeforeResistance -
        reduction * damageBeforeResistance;

    return {
        resistance: Math.trunc(resistance),
        effectiveResistance,
        damageBeforeResistance,
        damageAfterResistance,
    };
}