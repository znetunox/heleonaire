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
    weaponDamageRate = 0,
    sizeFixRate = 100,
): WeaponAttackResult {
    /*
     * Renewal:
     *
     * weaponAtkRate NÃO é aplicado aqui.
     *
     * A auditoria de rAthena mostrou que a aplicação explícita de
     * sd->bonus.weapon_atk_rate está no caminho #ifndef RENEWAL.
     *
     * Portanto, neste ponto usamos o ATK base efetivo da arma
     * fornecido pelo WeaponContext.
     */
    const baseAttack =
        Math.max(
            0,
            weapon.attack,
        );

    /*
     * Mantemos este campo por compatibilidade com o resultado atual.
     *
     * Ele não representa mais uma arma modificada por weaponAtkRate.
     */
    const ratedBaseAttack =
        Math.floor(
            baseAttack *
            (100 + weaponAtkRate) /
            100,
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
     * status_weapon_atk():
     *
     *   weapon ATK = wa.atk + wa.atk2
     *
     * A composição exata de wa.atk / wa.atk2 com refine ainda será
     * auditada separadamente.
     */
    const weaponAtk =
        ratedBaseAttack +
        refineBonus;

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
     *   variance = 5.0 * wa->atk * wlv / 100.0
     *
     * Importante: usa o ATK base da arma, não o valor acrescido
     * por refine.
     */
    const variance =
        5.0 *
        ratedBaseAttack *
        weaponLevel /
        100.0;

    /*
     * Renewal base-stat weapon bonus:
     *
     *   base_stat_bonus = wa->atk * base_stat / 200.0
     *
     * Também usa o ATK base da arma, sem refine.
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

    const baseValue =
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

    /*
     * rAthena:
     *
     *   weapon damage
     *       ↓
     *   weapon damage rate
     *       ↓
     *   size fix
     */
    const weaponDamageBeforeSizeFix =
        baseValue +
        overRefineDamage;

    const weaponDamageAfterRate =
        Math.floor(
            weaponDamageBeforeSizeFix *
            (100 + weaponDamageRate) /
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