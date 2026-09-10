import type {
    CombatStats,
    WeaponContext,
} from "./combatTypes";

export interface WeaponAttackResult {
    min: number;
    max: number;
    value: number;

    variance: number;
    baseStatBonus: number;
    baseStat: number;

    overRefineDamage: number;
}

export function calculateWeaponAttack(
    attacker: CombatStats,
    weapon: WeaponContext,
    randomValue = 0.5,
    overRefineRandomValue = 0.5,
): WeaponAttackResult {
    const baseAttack =
        Math.max(0, weapon.attack);

    const weaponLevel =
        Math.max(0, weapon.weaponLevel);

    const refineBonus =
        Math.max(0, weapon.refineBonus);

    const weaponAtk =
        baseAttack +
        refineBonus;

    const variance =
        5.0 *
        baseAttack *
        weaponLevel /
        100.0;

    const usesDex =
        weapon.range > 3;

    const baseStat =
        usesDex
            ? attacker.dex
            : attacker.str;

    const baseStatBonus =
        baseAttack *
        baseStat /
        200.0;

    const min =
        Math.max(
            0,
            Math.floor(
                weaponAtk -
                variance +
                baseStatBonus,
            ),
        );

    const max =
        Math.min(
            65535,
            Math.floor(
                weaponAtk +
                variance +
                baseStatBonus,
            ),
        );

    const normalizedRandom =
        Math.min(
            0.999999999,
            Math.max(0, randomValue),
        );

    const value =
        min +
        Math.floor(
            (max - min + 1) *
            normalizedRandom,
        );

    const overRefineBonus =
        Math.max(
            0,
            Math.floor(weapon.overRefineBonus),
        );

    const normalizedOverRefineRandom =
        Math.min(
            0.999999999,
            Math.max(
                0,
                overRefineRandomValue,
            ),
        );

    const overRefineDamage =
        overRefineBonus > 0
            ? 1 +
            Math.floor(
                overRefineBonus *
                normalizedOverRefineRandom,
            )
            : 0;

    return {
        min,
        max,
        value,
        variance,
        baseStatBonus,
        baseStat,
        overRefineDamage,
    };
}