import { StatSystem } from "./StatSystem";
const system = new StatSystem(null);
console.log("=== STAT COST TEST ===");
for (const value of [
    1,
    9,
    10,
    11,
    19,
    20,
    29,
    30,
    99,
    100,
    104,
    105,
]) {
    console.log(`${value} -> ${value + 1}: ${system.getStatCost(value)} points`);
}
console.log("");
console.log("=== INCREASE TEST ===");
const stats = {
    str: 10,
    agi: 1,
    vit: 1,
    int: 1,
    dex: 1,
    luk: 1,
};
const result = system.increaseStat(stats, 100, "str", 5);
console.log(result);
