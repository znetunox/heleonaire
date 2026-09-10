import type {
    CharacterStatValues,
} from "../stats/StatSystem";

export interface CombatStats {
    level: number;

    str: number;
    agi: number;
    vit: number;
    int: number;
    dex: number;
    luk: number;

    batk: number;
    statusAtk: number;
    patk: number;

    def1: number;
    def2: number;
    res: number;

    mdef1: number;
    mdef2: number;

    hit: number;
    flee: number;
    crit: number;
}

export interface WeaponSnapshot {
    itemId: number;
    aegisName: string;
    name: string;

    slot: string;
    inventoryId: string | null;

    attack: number;
    weaponLevel: number;
    weaponType: string;
    range: number;

    refineLevel: number;
    refineBonus: number;
    overRefineBonus: number;
}

/**
 * Compatibility alias used by the weapon calculator.
 *
 * WeaponContext will eventually become the richer weapon
 * combat representation when weapon modifiers are added.
 */
export type WeaponContext = WeaponSnapshot;

export interface AmmoSnapshot {
    itemId: number;
    aegisName: string;
    name: string;

    attack: number;
    subType: string | null;

    inventoryId: string | null;
}

export interface PlayerCombatSnapshot {
    characterId: string;
    name: string;
    jobKey: string;

    stats: CharacterStatValues;
    combatStats: CombatStats;

    /**
     * EATK originating from equipment/status effects.
     */
    equipAtk: number;

    /**
     * Ammo attack available when the attack uses ammunition.
     */
    ammoAtk: number;

    /**
     * Renewal bAtkRate.
     *
     * Applied to (weaponAtk + equipAtk) during the
     * basic physical attack composition.
     */
    atkRate: number;

    /**
     * Renewal bWeaponAtkRate.
     *
     * Applied to the base weapon ATK before refine ATK
     * is added.
     */
    weaponAtkRate: number;

    /**
     * Provisional generic weapon damage rate.
     *
     * The faithful rAthena representation will eventually
     * be indexed by weapon type.
     */
    weaponDamageRate: number;

    weapon: WeaponSnapshot | null;
    ammo: AmmoSnapshot | null;
}

export interface MobCombatSnapshot {
    mobDbId: number;
    aegisName: string;
    name: string;

    stats: CombatStats;

    attack: number;
    attack2: number;

    attackRange: number;

    size: string;
    race: string;
    element: string;
    elementLevel: number;
}

export interface CombatSnapshot {
    player: PlayerCombatSnapshot;
}

export interface AttackComponents {
    statusAtk: number;
    weaponAtk: number;
    equipAtk: number;
    masteryAtk: number;

    patk: number;
}

export interface AttackContext {
    attacker: PlayerCombatSnapshot;
    target: MobCombatSnapshot;

    /**
     * Components are supplied by the attack-resolution stage.
     */
    components: AttackComponents;

    /**
     * Final calculated skill ratio.
     *
     * Normal weapon attack = 100.
     */
    skillRatio: number;

    /**
     * Final calculated additive skill constant.
     *
     * Normal weapon attack = 0.
     */
    skillConstant: number;

    skillId: number;

    isCritical: boolean;
    usesAmmo: boolean;
}

export interface DefenseContext {
    def1: number;
    def2: number;

    mdef1: number;
    mdef2: number;

    /**
     * Final skill ratio used by the physical DEF calculation.
     */
    skillRatio: number;

    /**
     * Whether the attack uses DEF piercing.
     */
    isDefPiercing: boolean;

    /**
     * Whether DEF1 should be ignored by the attack.
     */
    ignoreDef: boolean;
}

export interface ResistanceResult {
    resistance: number;
    effectiveResistance: number;
    damageBeforeResistance: number;
    damageAfterResistance: number;
}

export interface DefenseResult {
    def1: number;
    def2: number;

    /**
     * Damage remaining after the physical DEF calculation.
     *
     * This is intentionally kept as a number because the
     * complete rAthena pipeline will add integer truncation,
     * RES, post-defense modifiers, element and critical
     * processing in later stages.
     */
    effectiveDef: number;
}

export interface DamageResult {
    damage: number;

    hit: boolean;
    isCritical: boolean;

    components: AttackComponents;

    resistance: ResistanceResult;
    defense: DefenseResult;

    preDefenseDamage: number;
    postResistanceDamage: number;
    postDefenseDamage: number;
}
