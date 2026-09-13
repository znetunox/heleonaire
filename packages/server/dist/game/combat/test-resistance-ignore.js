import { calculateResistanceReduction, } from "./resistanceCalculator";
const noIgnore = calculateResistanceReduction(100, 100);
if (noIgnore.effectiveResistance !== 100 ||
    noIgnore.damageAfterResistance !== 84) {
    throw new Error(`Unexpected baseline RES result: ${JSON.stringify(noIgnore)}`);
}
const partialIgnore = calculateResistanceReduction(100, 100, 25);
if (partialIgnore.effectiveResistance !== 75 ||
    partialIgnore.damageAfterResistance !== 88) {
    throw new Error(`Unexpected partial ignore RES result: ${JSON.stringify(partialIgnore)}`);
}
const cappedIgnore = calculateResistanceReduction(100, 100, 80);
if (cappedIgnore.effectiveResistance !== 50 ||
    cappedIgnore.damageAfterResistance !== 92) {
    throw new Error(`Unexpected capped ignore RES result: ${JSON.stringify(cappedIgnore)}`);
}
console.log("Ignore RES tests passed");
