import {
    calculateDefenseReduction,
} from "./defenseCalculator";

const target = {
    def1: 100,
    def2: 50,
} as unknown as Parameters<typeof calculateDefenseReduction>[1];

const normal = calculateDefenseReduction(
    1000,
    target,
    {
        skillRatio: 100,
        isDefPiercing: false,
        ignoreDef: false,
    },
);

if (normal.effectiveDef !== 770) {
    throw new Error(
        `Unexpected normal DEF result: ${JSON.stringify(normal)}`,
    );
}

const ignored = calculateDefenseReduction(
    1000,
    target,
    {
        skillRatio: 100,
        isDefPiercing: false,
        ignoreDef: true,
    },
);

if (ignored.effectiveDef !== 1000) {
    throw new Error(
        `Ignore DEF applied the normal formula: ${JSON.stringify(ignored)}`,
    );
}

const piercing = calculateDefenseReduction(
    1000,
    target,
    {
        skillRatio: 100,
        isDefPiercing: true,
        ignoreDef: false,
    },
);

if (piercing.effectiveDef !== 1050) {
    throw new Error(
        `Unexpected piercing result: ${JSON.stringify(piercing)}`,
    );
}

const ignoredAndPiercing = calculateDefenseReduction(
    1000,
    target,
    {
        skillRatio: 100,
        isDefPiercing: true,
        ignoreDef: true,
    },
);

if (ignoredAndPiercing.effectiveDef !== 1050) {
    throw new Error(
        `Ignore DEF and piercing were combined incorrectly: ${JSON.stringify(ignoredAndPiercing)}`,
    );
}

console.log("Skill Ignore DEF tests passed");