import type {
    AttackComponents,
} from "./combatTypes";

export interface AttackCompositionResult {
    baseDamage: number;
    prePatkDamage: number;
    postPatkDamage: number;
    masteryDamage: number;
    skillDamage: number;
    finalDamage: number;
}

export function calculateAttackComposition(
    components: AttackComponents,
    patk: number,
    skillRatio: number,
    skillConstant: number,
): AttackCompositionResult {
    /*
     * Renewal physical attack scaffold.
     *
     * Base attack components:
     *
     *   statusAtk
     * + weaponAtk
     * + equipAtk
     * + percentAtk
     *
     * Ammo is intentionally NOT added here independently.
     * When applicable, ammo attack belongs to the equipAtk side
     * of the rAthena weapon/equipment calculation.
     */
    const baseDamage =
        components.statusAtk +
        components.weaponAtk +
        components.equipAtk +
        components.percentAtk;

    /*
     * Renewal P.ATK modifier.
     */
    const postPatkDamage =
        Math.floor(
            baseDamage *
                (100 + patk) /
                100,
        );

    /*
     * Mastery ATK is kept separate from the P.ATK multiplication.
     */
    const masteryDamage =
        postPatkDamage +
        components.masteryAtk;

    /*
     * Skill ratio/constant are applied after the basic
     * physical attack composition.
     *
     * For a normal attack:
     *   skillRatio = 100
     *   skillConstant = 0
     */
    const skillDamage =
        Math.floor(
            masteryDamage *
                skillRatio /
                100,
        ) +
        skillConstant;

    const prePatkDamage =
        baseDamage;

    const finalDamage =
        skillDamage;

    return {
        baseDamage,
        prePatkDamage,
        postPatkDamage,
        masteryDamage,
        skillDamage,
        finalDamage,
    };
}