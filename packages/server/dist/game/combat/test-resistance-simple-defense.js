import { calculateResistanceReduction, } from "./resistanceCalculator";
import { calculateDefenseReduction, } from "./defenseCalculator";
const target = {
    def1: 50,
    def2: 10,
};
function resolve(simpleDefense, ignoreRes, ignoreDef) {
    const resistance = calculateResistanceReduction(1000, 100, 0, ignoreRes);
    return {
        resistance,
        defense: calculateDefenseReduction(resistance.damageAfterResistance, target, {
            skillRatio: 100,
            isDefPiercing: false,
            ignoreDef,
            simpleDefense,
            weaponDefenseType: 1,
        }),
    };
}
const normal = resolve(false, false, false);
if (normal.resistance.effectiveResistance !== 100 ||
    normal.resistance.damageAfterResistance !== 840 ||
    normal.defense.effectiveDef !== 780) {
    throw new Error(`Unexpected normal RES/DEF result: ${JSON.stringify(normal)}`);
}
const simple = resolve(true, false, false);
if (simple.resistance.effectiveResistance !== 100 ||
    simple.resistance.damageAfterResistance !== 840 ||
    simple.defense.effectiveDef !== 780) {
    throw new Error(`Simple Defense changed RES behavior: ${JSON.stringify(simple)}`);
}
const simpleIgnoreRes = resolve(true, true, false);
if (simpleIgnoreRes.resistance.effectiveResistance !== 0 ||
    simpleIgnoreRes.resistance.damageAfterResistance !== 1000 ||
    simpleIgnoreRes.defense.effectiveDef !== 940) {
    throw new Error(`Simple Defense + Ignore RES is incorrect: ${JSON.stringify(simpleIgnoreRes)}`);
}
const ignoreBoth = resolve(false, true, true);
if (ignoreBoth.resistance.effectiveResistance !== 0 ||
    ignoreBoth.resistance.damageAfterResistance !== 1000 ||
    ignoreBoth.defense.effectiveDef !== 1000) {
    throw new Error(`Ignore RES + Ignore DEF is incorrect: ${JSON.stringify(ignoreBoth)}`);
}
console.log("RES and Simple Defense tests passed");
