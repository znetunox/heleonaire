import type {
    CharacterStatValues,
} from "../stats/StatSystem";
import type {
    ParsedAttributeTable,
    RathenaElement,
} from "../../data/rathena/parsers/attrFixParser";

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

    /**
     * rAthena bAtk.
     *
     * Applied to wa.atk after bWeaponAtkRate.
     */
    weaponAtkBonus: number;

    /**
     * rAthena bAtk2.
     *
     * Applied to wa.atk2 together with normal refine ATK.
     */
    weaponAtk2Bonus: number;

    weaponLevel: number;
    weaponType: string;
    range: number;

    refineLevel: number;
    refineBonus: number;
    overRefineBonus: number;
    element?: RathenaElement;
}

/**
 * Compatibility alias used by the weapon calculator.
 *
 * WeaponContext will eventually become the richer weapon
 * combat representation when additional weapon modifiers
 * are introduced.
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
     *
     * Includes bBaseAtk and static equipment attack that
     * belongs to EATK.
     */
    equipAtk: number;

    /**
     * Ammo attack available when the attack uses ammunition.
     */
    ammoAtk: number;

    /**
     * Renewal bAtkRate.
     *
     * Applied to:
     *
     *     (weaponAtk + equipAtk)
     *
     * during physical attack composition.
     */
    atkRate: number;

    /**
     * Renewal bWeaponAtkRate.
     *
     * Applied to the weapon base ATK before normal refine
     * ATK is added.
     */
    weaponAtkRate: number;

    /**
     * Renewal percentage of target RES ignored by the attack.
     */
    ignoreRes: number;

    /**
     * Renewal percentage of DEF1 and DEF2 ignored by the attack.
     */
    ignoreDefRate: number;

    ignoreDefByRace: Record<string, number>;
    ignoreDefByClass: Record<string, number>;

    defPiercingByRace: Record<string, boolean>;
    defPiercingByElement: Record<string, boolean>;
    defPiercingByClass: Record<string, boolean>;

    /**
     * Renewal bWeaponDamageRate.
     *
     * Kept indexed by rAthena weapon type.
     *
     * Example:
     *
     * {
     *     Sword: 20,
     *     Dagger: 10
     * }
     */
    weaponDamageRateByType: Record<string, number>;

    /**
     * Renewal bWeaponAtk,w,n.
     *
     * Kept indexed by weapon type because the bonus only
     * applies when the corresponding weapon type is equipped.
     *
     * Example:
     *
     * {
     *     Sword: 20,
     *     Dagger: 10
     * }
     */
    weaponAtkByType: Record<string, number>;

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
    class: string;
    element: string;
    elementLevel: number;
}

export type CombatAttackType =
    | "weapon"
    | "magic"
    | "misc";

export type CombatAttackRangeType =
    | "short"
    | "long";

export type CombatAttackHand =
    | "right"
    | "left"
    | "both"
    | "none";

export interface CombatClassification {
    attacker: {
        race?: string;
        race2: readonly string[];
        class?: string;
        element?: RathenaElement;
    };

    target: {
        race?: string;
        race2: readonly string[];
        class?: string;
        element?: RathenaElement;
        elementLevel?: number;
        size?: string;
    };

    attack: {
        element: RathenaElement;
        rangeType: CombatAttackRangeType;
        type: CombatAttackType;
        hand: CombatAttackHand;
    };
}

export interface AttackFlags {
    ignoreAttackerCardfix: boolean;
    ignoreDefenderCardfix: boolean;
    ignoreElementCardfix: boolean;
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
    components: AttackComponents;

    attackElement: RathenaElement;
    statusElement?: RathenaElement;
    targetElement: RathenaElement;
    targetElementLevel: number;
    defPiercing?: boolean;
    ignoreDef?: boolean;
    simpleDefense?: boolean;
    attributeTable?: ParsedAttributeTable;
    ignoreResRate?: number;
    ignoreRes?: boolean;

    skillRatio: number;
    skillConstant: number;
    skillId: number;
    isCritical: boolean;
    usesAmmo: boolean;

    classification?: CombatClassification;
    flags?: AttackFlags;
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

    ignoreDefRate?: number;

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
    elementalComponents?: AttackComponents;

    resistance: ResistanceResult;
    defense: DefenseResult;

    preDefenseDamage: number;
    postResistanceDamage: number;
    postDefenseDamage: number;

    /**
     * Damage before elemental adjustment.
     * Element is applied AFTER RES/DEF/Post-DEF per Renewal.
     */
    preElementDamage?: number;

    /**
     * Damage after elemental adjustment.
     * This is the damage after element type interaction.
     */
    postElementDamage?: number;
}