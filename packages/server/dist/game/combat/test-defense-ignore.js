import { calculateDefenseReduction, resolveDefPiercing, } from "./defenseCalculator";
const target = {
    def1: 100,
    def2: 20,
    race: "DemiHuman",
    class: "Boss",
};
const baseline = calculateDefenseReduction(1000, target, {
    skillRatio: 100,
    isDefPiercing: false,
    ignoreDef: false,
});
if (baseline.def1 !== 100 ||
    baseline.def2 !== 20 ||
    baseline.effectiveDef !== 800) {
    throw new Error(`Unexpected baseline DEF result: ${JSON.stringify(baseline)}`);
}
const combined = calculateDefenseReduction(1000, {
    ...target,
    def1: 101,
    def2: 37,
}, {
    skillRatio: 100,
    isDefPiercing: false,
    ignoreDef: false,
    ignoreDefRate: 10,
    targetRace: "DemiHuman",
    targetClass: "Boss",
    ignoreDefByRace: {
        DemiHuman: 15,
        All: 20,
    },
    ignoreDefByClass: {
        Boss: 10,
        All: 5,
    },
});
if (combined.def1 !== 41 ||
    combined.def2 !== 15) {
    throw new Error(`Unexpected combined ignore DEF result: ${JSON.stringify(combined)}`);
}
const piercing = calculateDefenseReduction(1000, target, {
    skillRatio: 100,
    isDefPiercing: true,
    ignoreDef: false,
});
if (piercing.effectiveDef !== 1050) {
    throw new Error(`Unexpected piercing result: ${JSON.stringify(piercing)}`);
}
const racePiercing = resolveDefPiercing("DemiHuman", "Fire", "Boss", { DemiHuman: true }, {}, {});
if (!racePiercing) {
    throw new Error("Race piercing did not match the target");
}
const elementPiercing = resolveDefPiercing("DemiHuman", "Fire", "Boss", {}, { Fire: true }, {});
const classPiercing = resolveDefPiercing("DemiHuman", "Fire", "Boss", {}, {}, { Boss: true });
if (!elementPiercing || !classPiercing) {
    throw new Error("Element or class piercing did not match the target");
}
const piercingAfterIgnore = calculateDefenseReduction(1000, target, {
    skillRatio: 100,
    isDefPiercing: true,
    ignoreDef: false,
    ignoreDefRate: 25,
});
if (piercingAfterIgnore.def1 !== 75 ||
    piercingAfterIgnore.effectiveDef !== 1037) {
    throw new Error(`Unexpected piercing plus ignore DEF result: ${JSON.stringify(piercingAfterIgnore)}`);
}
const partial = calculateDefenseReduction(1000, target, {
    skillRatio: 100,
    isDefPiercing: false,
    ignoreDef: false,
    ignoreDefRate: 25,
});
if (partial.def1 !== 75 ||
    partial.def2 !== 15 ||
    partial.effectiveDef !== 842) {
    throw new Error(`Unexpected partial ignore DEF result: ${JSON.stringify(partial)}`);
}
const capped = calculateDefenseReduction(1000, target, {
    skillRatio: 100,
    isDefPiercing: false,
    ignoreDef: false,
    ignoreDefRate: 140,
});
if (capped.def1 !== 0 ||
    capped.def2 !== 0 ||
    capped.effectiveDef !== 1000) {
    throw new Error(`Unexpected capped ignore DEF result: ${JSON.stringify(capped)}`);
}
console.log("Ignore DEF tests passed");
