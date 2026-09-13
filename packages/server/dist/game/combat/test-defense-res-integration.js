import { combatSystem, } from "./CombatSystem";
const neutralAttributeTable = {
    version: 1,
    levels: [1],
    getRatio: () => 100,
};
const attacker = {
    combatStats: {
        batk: 50,
        patk: 0,
        crit: 0,
    },
    atkRate: 0,
    ignoreRes: 0,
    ignoreDefRate: 0,
    ignoreDefByRace: {},
    ignoreDefByClass: {},
    defPiercingByRace: {},
    defPiercingByElement: {},
    defPiercingByClass: {},
};
const target = {
    stats: {
        def1: 100,
        def2: 20,
        res: 100,
    },
    race: "DemiHuman",
    class: "Normal",
    element: "Neutral",
};
function runCase(name, options) {
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
        attributeTable: neutralAttributeTable,
        skillRatio: 100,
        skillConstant: 0,
        skillId: 0,
        isCritical: false,
        usesAmmo: false,
        ...options,
    };
    const result = combatSystem.performWeaponAttack(context);
    if (result.preDefenseDamage !== 170) {
        throw new Error(`${name}: unexpected pre-RES damage ${result.preDefenseDamage}`);
    }
    return result;
}
function assertCase(name, result, expected) {
    if (result.postResistanceDamage !== expected.postResistanceDamage ||
        result.postDefenseDamage !== expected.postDefenseDamage ||
        result.resistance.effectiveResistance !== expected.effectiveResistance ||
        result.defense.effectiveDef !== expected.effectiveDef) {
        throw new Error(`${name}: ${JSON.stringify(result)}`);
    }
}
assertCase("baseline", runCase("baseline", {}), {
    postResistanceDamage: 143,
    postDefenseDamage: 97,
    effectiveResistance: 100,
    effectiveDef: 97,
});
assertCase("ignore RES rate", runCase("ignore RES rate", { ignoreResRate: 50 }), {
    postResistanceDamage: 155,
    postDefenseDamage: 107,
    effectiveResistance: 50,
    effectiveDef: 107,
});
assertCase("ignore RES boolean", runCase("ignore RES boolean", { ignoreRes: true }), {
    postResistanceDamage: 170,
    postDefenseDamage: 119,
    effectiveResistance: 0,
    effectiveDef: 119,
});
assertCase("simple defense", runCase("simple defense", { simpleDefense: true }), {
    postResistanceDamage: 143,
    postDefenseDamage: 23,
    effectiveResistance: 100,
    effectiveDef: 23,
});
assertCase("simple defense + ignore RES", runCase("simple defense + ignore RES", {
    simpleDefense: true,
    ignoreRes: true,
}), {
    postResistanceDamage: 170,
    postDefenseDamage: 50,
    effectiveResistance: 0,
    effectiveDef: 50,
});
assertCase("ignore DEF", runCase("ignore DEF", { ignoreDef: true }), {
    postResistanceDamage: 143,
    postDefenseDamage: 143,
    effectiveResistance: 100,
    effectiveDef: 143,
});
assertCase("ignore DEF + ignore RES", runCase("ignore DEF + ignore RES", {
    ignoreDef: true,
    ignoreRes: true,
}), {
    postResistanceDamage: 170,
    postDefenseDamage: 170,
    effectiveResistance: 0,
    effectiveDef: 170,
});
assertCase("simple defense + ignore DEF", runCase("simple defense + ignore DEF", {
    simpleDefense: true,
    ignoreDef: true,
}), {
    postResistanceDamage: 143,
    postDefenseDamage: 143,
    effectiveResistance: 100,
    effectiveDef: 143,
});
console.log("DEF/RES integration tests passed");
