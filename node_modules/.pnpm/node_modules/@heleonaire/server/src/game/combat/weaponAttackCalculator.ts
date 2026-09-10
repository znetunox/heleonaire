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
}

export function calculateWeaponAttack(
    attacker: CombatStats,
    weapon: WeaponContext,
    randomValue = 0.5,
): WeaponAttackResult {
    const attack =
        Math.max(0, weapon.attack);

    const weaponLevel =
        Math.max(0, weapon.weaponLevel);

    /*
     * Renewal rAthena:
     *
     * variance =
     *     5% × weapon attack × weapon level
     */
    const variance =
        5.0 *
        attack *
        weaponLevel /
        100.0;

    /*
     * Ranged weapon families use DEX.
     * Melee weapons use STR.
     */
    const usesDex =
        weapon.range > 3;

    const baseStat =
        usesDex
            ? attacker.dex
            : attacker.str;

    /*
     * Renewal weapon base-stat bonus:
     *
     * weapon attack × base stat / 200
     */
    const baseStatBonus =
        attack *
        baseStat /
        200.0;

    const min =
        Math.max(
            0,
            Math.floor(
                attack -
                variance +
                baseStatBonus,
            ),
        );

    const max =
        Math.min(
            65535,
            Math.floor(
                attack +
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

    return {
        min,
        max,
        value,
        variance,
        baseStatBonus,
        baseStat,
    };
}