import type {
    CombatStats,
    DefenseResult,
} from "./combatTypes";

export function calculateDefenseReduction(
    damage: number,
    target: CombatStats,
): DefenseResult {
    const def1 = Math.max(0, target.def1);
    const def2 = Math.max(0, target.def2);

    const effectiveDef =
        damage *
        (4000 + def1) /
        (4000 + 10 * def1) -
        def2;

    return {
        def1,
        def2,
        effectiveDef,
    };
}
