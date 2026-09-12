import type {
    CombatStats,
    WeaponContext,
} from "./combatTypes";

export interface WeaponAttackResult {
    min: number;
    max: number;
    value: number;

    /**
     * Effective wa.atk after bWeaponAtkRate,
     * before normal refine (wa.atk2).
     */
    ratedBaseAttack: number;

    variance: number;
    baseStatBonus: number;
    baseStat: number;

    overRefineDamage: number;
}

export interface WeaponAttackOptions {
    weaponAtkRate?: number;

    /**
     * rAthena bAtk.
     *
     * Applied to wa.atk after bWeaponAtkRate.
     */
    weaponAtkScriptBonus?: number;

    /**
     * rAthena bAtk2.
     *
     * Applied to wa.atk2 together with normal refine ATK.
     */
    weaponAtk2ScriptBonus?: number;

    randomValue?: number;
    overRefineRandomValue?: number;
    weaponDamageRate?: number;
    sizeFixRate?: number;
}

export function calculateWeaponAttack(
    attacker: CombatStats,
    weapon: WeaponContext,
    options: WeaponAttackOptions = {},
): WeaponAttackResult {
    const {
        weaponAtkRate = 0,
        weaponAtkScriptBonus = 0,
        weaponAtk2ScriptBonus = 0,
        randomValue = 0.5,
        overRefineRandomValue = 0.5,
        weaponDamageRate = 0,
        sizeFixRate = 100,
    } = options;

    /*
     * Renewal weapon ATK construction:
     *
     * wa.atk
     *   = Item ATK
     *   + bWeaponAtkRate
     *
     * wa.atk2
     *   = normal refine ATK
     *
     * watk
     *   = wa.atk + wa.atk2
     *
     * Important:
     * bWeaponAtkRate modifies wa.atk before refine is added.
     */
    const baseAttack =
        Math.max(
            0,
            Math.floor(weapon.attack),
        );

    const normalizedWeaponAtkScriptBonus =
        Number.isFinite(weaponAtkScriptBonus)
            ? Math.floor(weaponAtkScriptBonus)
            : 0;

    const normalizedWeaponAtkRate =
        Number.isFinite(weaponAtkRate)
            ? weaponAtkRate
            : 0;

    const ratedBaseAttack =
        Math.max(
            0,
            Math.floor(
                baseAttack *
                (100 + normalizedWeaponAtkRate) /
                100,
            ),
        );

    const weaponAtk =
        ratedBaseAttack +
        normalizedWeaponAtkScriptBonus;

    const weaponLevel =
        Math.max(
            0,
            Math.floor(weapon.weaponLevel),
        );

    /*
     * wa.atk2 = normal refine ATK.
     *
     * It contributes to watk, but does NOT participate in:
     * - weapon variance
     * - base-stat weapon bonus
     */
    const refineBonus =
        Math.max(
            0,
            Math.floor(weapon.refineBonus),
        );

    const normalizedWeaponAtk2ScriptBonus =
        Number.isFinite(weaponAtk2ScriptBonus)
            ? Math.floor(weaponAtk2ScriptBonus)
            : 0;

    const weaponAtk2 =
        refineBonus +
        normalizedWeaponAtk2ScriptBonus;

    /*
     * Renewal:
     *
     * ranged weapon → DEX
     * melee weapon  → STR
     *
     * The SU_SOULATTACK exception is not represented in the
     * current combat snapshot yet and will be added separately.
     */
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
     * Renewal weapon variance:
     *
     * variance =
     *     5.0 * wa.atk * weaponLevel / 100.0
     *
     * IMPORTANT:
     * uses wa.atk after bWeaponAtkRate,
     * but before normal refine.
     */
    const variance =
        5.0 *
        weaponAtk *
        weaponLevel /
        100.0;

    /*
     * Renewal base-stat weapon bonus:
     *
     * base_stat_bonus =
     *     wa.atk * base_stat / 200.0
     *
     * Again, wa.atk excludes normal refine.
     */
    const baseStatBonus =
        weaponAtk *
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

    /*
     * rAthena uses the maximum weapon damage for critical
     * attacks and Maximize Power.
     *
     * Critical is not yet passed into this calculator, so the
     * current resolver continues using deterministic randomValue.
     */
    const normalizedRandom =
        Math.min(
            0.999999999,
            Math.max(
                0,
                randomValue,
            ),
        );

    const baseValue =
        min +
        Math.floor(
            (max - min + 1) *
            normalizedRandom,
        );

    /*
     * Over-refine is separate from wa.atk2.
     *
     * rAthena:
     *     damage += random(1..overrefine)
     */
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

    /*
     * Renewal order:
     *
     * weapon damage
     *     ↓
     * over-refine
     *     ↓
     * weapon damage rate
     *     ↓
     * size fix
     */
    const weaponDamageBeforeRate =
        baseValue +
        overRefineDamage;

    const normalizedWeaponDamageRate =
        Number.isFinite(weaponDamageRate)
            ? weaponDamageRate
            : 0;

    const weaponDamageAfterRate =
        Math.floor(
            weaponDamageBeforeRate *
            (100 + normalizedWeaponDamageRate) /
            100,
        );

    const normalizedSizeFixRate =
        Math.max(
            0,
            Math.min(
                100,
                Math.floor(sizeFixRate),
            ),
        );

    const value =
        Math.floor(
            weaponDamageAfterRate *
            normalizedSizeFixRate /
            100,
        );

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