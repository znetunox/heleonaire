import {
    combatSystem,
} from "./CombatSystem";
import type {
    AttackContext,
    AttackFlags,
    CombatClassification,
    DamageResult,
} from "./combatTypes";

const neutralAttributeTable = {
    version: 1,
    levels: [1],
    getRatio: () => 100,
};

const attacker = {
    characterId: "test",
    name: "Test",
    jobKey: "KNIGHT",
    race: "Human",
    class: "Knight",
    element: "Neutral",
    race2: [],
    combatStats: {
        batk: 50,
        patk: 0,
        crit: 0,
        def1: 0,
        def2: 0,
        res: 0,
        mdef1: 0,
        mdef2: 0,
        hit: 0,
        flee: 0,
        level: 1,
        str: 0,
        agi: 0,
        vit: 0,
        int: 0,
        dex: 0,
        luk: 0,
    },
    stats: {
        str: 0,
        agi: 0,
        vit: 0,
        int: 0,
        dex: 0,
        luk: 0,
    },
    equipAtk: 0,
    ammoAtk: 0,
    atkRate: 0,
    weaponAtkRate: 0,
    weaponDamageRateByType: {},
    weaponAtkByType: {},
    cardfix: {
        addRace: {},
        addElement: {},
        addSize: {},
        addRace2: {},
        addClass: {},
        subElement: {},
        subDefElement: {},
        subSize: {},
        weaponSubSize: {},
        subRace2: {},
        subRace: {},
        subClass: {},
        defenseAgainstAttackerClass: {},
    },
    weapon: null,
    ammo: null,
} as unknown as AttackContext["attacker"];

const target = {
    mobDbId: 1,
    aegisName: "TEST_MOB",
    name: "Test Mob",
    stats: {
        def1: 100,
        def2: 20,
        res: 100,
        batk: 0,
        statusAtk: 0,
        patk: 0,
        mdef1: 0,
        mdef2: 0,
        hit: 0,
        flee: 0,
        crit: 0,
        level: 1,
        str: 0,
        agi: 0,
        vit: 0,
        int: 0,
        dex: 0,
        luk: 0,
    },
    attack: 0,
    attack2: 0,
    attackRange: 1,
    size: "Medium",
    race: "DemiHuman",
    race2: [],
    class: "Normal",
    element: "Neutral",
    elementLevel: 1,
} as unknown as AttackContext["target"];

function runCase(
    name: string,
    options: Pick<
        AttackContext,
        "ignoreResRate" | "ignoreRes" | "simpleDefense" | "ignoreDef"
    >,
): DamageResult {
    const classification: CombatClassification = {
        attacker: {
            race: "Human",
            class: "Knight",
            element: "Neutral",
            race2: [],
        },
        target: {
            race: "DemiHuman",
            race2: [],
            class: "Normal",
            element: "Neutral",
            elementLevel: 1,
            size: "Medium",
        },
        attack: {
            element: "Neutral",
            rangeType: "short",
            type: "weapon",
            hand: "right",
        },
    };

    const flags: AttackFlags = {
        ignoreAttackerCardfix: false,
        ignoreDefenderCardfix: false,
        ignoreElementCardfix: false,
    };

    const context = {
        attacker,
        target,
        components: {
            statusAtk: 0,
            weaponAtk: 50,
            equipAtk: 20,
            masteryAtk: 0,
            patk: 0,
        },
        attackElement: "Neutral",
        targetElement: "Neutral",
        targetElementLevel: 1,
        attributeTable:
            neutralAttributeTable,
        skillRatio: 100,
        skillConstant: 0,
        skillId: 0,
        isCritical: false,
        usesAmmo: false,
        classification,
        flags,
        ...options,
    } as AttackContext;

    const result = combatSystem.performWeaponAttack(context);

    if (result.preDefenseDamage !== 170) {
        throw new Error(
            `${name}: unexpected pre-RES damage ${result.preDefenseDamage}`,
        );
    }

    return result;
}

function assertCase(
    name: string,
    result: DamageResult,
    expected: {
        postResistanceDamage: number;
        postDefenseDamage: number;
        effectiveResistance: number;
        effectiveDef: number;
    },
): void {
    if (
        result.postResistanceDamage !== expected.postResistanceDamage ||
        result.postDefenseDamage !== expected.postDefenseDamage ||
        result.resistance.effectiveResistance !== expected.effectiveResistance ||
        result.defense.effectiveDef !== expected.effectiveDef
    ) {
        throw new Error(
            `${name}: ${JSON.stringify(result)}`,
        );
    }
}

assertCase(
    "baseline",
    runCase("baseline", {}),
    {
        postResistanceDamage: 143,
        postDefenseDamage: 97,
        effectiveResistance: 100,
        effectiveDef: 97,
    },
);

assertCase(
    "ignore RES rate",
    runCase("ignore RES rate", { ignoreResRate: 50 }),
    {
        postResistanceDamage: 155,
        postDefenseDamage: 107,
        effectiveResistance: 50,
        effectiveDef: 107,
    },
);

assertCase(
    "ignore RES boolean",
    runCase("ignore RES boolean", { ignoreRes: true }),
    {
        postResistanceDamage: 170,
        postDefenseDamage: 119,
        effectiveResistance: 0,
        effectiveDef: 119,
    },
);

assertCase(
    "simple defense",
    runCase("simple defense", { simpleDefense: true }),
    {
        postResistanceDamage: 143,
        postDefenseDamage: 23,
        effectiveResistance: 100,
        effectiveDef: 23,
    },
);

assertCase(
    "simple defense + ignore RES",
    runCase("simple defense + ignore RES", {
        simpleDefense: true,
        ignoreRes: true,
    }),
    {
        postResistanceDamage: 170,
        postDefenseDamage: 50,
        effectiveResistance: 0,
        effectiveDef: 50,
    },
);

assertCase(
    "ignore DEF",
    runCase("ignore DEF", { ignoreDef: true }),
    {
        postResistanceDamage: 143,
        postDefenseDamage: 143,
        effectiveResistance: 100,
        effectiveDef: 143,
    },
);

assertCase(
    "ignore DEF + ignore RES",
    runCase("ignore DEF + ignore RES", {
        ignoreDef: true,
        ignoreRes: true,
    }),
    {
        postResistanceDamage: 170,
        postDefenseDamage: 170,
        effectiveResistance: 0,
        effectiveDef: 170,
    },
);

assertCase(
    "simple defense + ignore DEF",
    runCase("simple defense + ignore DEF", {
        simpleDefense: true,
        ignoreDef: true,
    }),
    {
        postResistanceDamage: 143,
        postDefenseDamage: 143,
        effectiveResistance: 100,
        effectiveDef: 143,
    },
);

console.log("DEF/RES integration tests passed");
