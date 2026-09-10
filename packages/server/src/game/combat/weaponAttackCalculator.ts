import type {
    CombatStats,
    WeaponContext,
} from "./combatTypes";

export interface WeaponAttackResult {
    min: number;
    max: number;
    value: number;

    ratedBaseAttack: number;
    variance: number;
    baseStatBonus: number;
    baseStat: number;

    overRefineDamage: number;
}

export function calculateWeaponAttack(
    attacker: CombatStats,
    weapon: WeaponContext,
    weaponAtkRate = 0,
    randomValue = 0.5,
    overRefineRandomValue = 0.5,
): WeaponAttackResult {
    const baseAttack =
        Math.max(
            0,
            weapon.attack,
        );

    const weaponLevel =
        Math.max(
            0,
            weapon.weaponLevel,
        );

    const refineBonus =
        Math.max(
            0,
            weapon.refineBonus,
        );

    /*
     * Renewal rAthena:
     *
     *   wa->atk += item.atk;
     *   wa->atk2 += refine bonus;
     *
     *   if (weapon_atk_rate)
     *       wa->atk += wa->atk * weapon_atk_rate / 100;
     *
     * Therefore bWeaponAtkRate applies to the
     * base weapon ATK, NOT to refine ATK.
     */
    const ratedBaseAttack =
        Math.floor(
            baseAttack *
            (100 + weaponAtkRate) /
            100,
        );

    /*
     * status_weapon_atk():
     *
     *   weapon ATK = wa.atk + wa.atk2
     */
    const weaponAtk =
        ratedBaseAttack +
        refineBonus;

    /*
     * Renewal weapon variance uses wa->atk,
     * which is the rated base weapon ATK and
     * excludes refine ATK.
     */
    const variance =
        5.0 *
        ratedBaseAttack *
        weaponLevel /
        100.0;

    const dexWeaponTypes = new Set([
        "Bow",
        "Musical",
        "Whip",
        "Revolver",
        "Rifle",
        "Gatling",
        "Shotgun",
        "Grenade",
    ]);

    const usesDex =
        dexWeaponTypes.has(
            weapon.weaponType,
        );

    const baseStat =
        usesDex
            ? attacker.dex
            : attacker.str;

    /*
     * Renewal base-stat weapon bonus:
     *
     *   wa->atk * base_stat / 200
     *
     * Again, wa->atk here excludes refine ATK.
     */
    const baseStatBonus =
        ratedBaseAttack *
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
            Math.max(
                0,
                randomValue,
            ),
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
            Math.floor(
                weapon.overRefineBonus,
            ),
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

        ratedBaseAttack,

        variance,
        baseStatBonus,
        baseStat,

        overRefineDamage,
    };
}