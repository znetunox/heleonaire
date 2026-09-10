export interface CombatStats {
    level: number;

    str: number;
    agi: number;
    vit: number;
    int: number;
    dex: number;
    luk: number;

    batk: number;

    def1: number;
    def2: number;

    mdef1: number;
    mdef2: number;

    hit: number;
    flee: number;
    crit: number;

    patk: number;

    res: number;
    mres: number;
}

export interface AttackComponents {
    statusAtk: number;
    weaponAtk: number;
    equipAtk: number;
    masteryAtk: number;
    percentAtk: number;
    ammoAtk: number;
}

export interface WeaponContext {
    attack: number;
    weaponLevel: number;
    weaponType: string;
    range: number;
    refineLevel: number;
    element?: number;
}

export interface AttackContext {
    attacker: CombatStats;
    target: CombatStats;

    attackType: "NORMAL" | "SKILL";

    skillRatio: number;
    skillConstant: number;

    components: AttackComponents;

    weapon?: WeaponContext;

    isCritical: boolean;
    isPerfectHit: boolean;
}

export interface DefenseResult {
    def1: number;
    def2: number;
    effectiveDef: number;
}

export interface DamageResult {
    damage: number;

    isCritical: boolean;
    hit: boolean;

    components: AttackComponents;

    defense: DefenseResult;

    preDefenseDamage: number;
    postDefenseDamage: number;
}
