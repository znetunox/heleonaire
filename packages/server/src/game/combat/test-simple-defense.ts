import {
    calculateDefenseReduction,
} from "./defenseCalculator";

const target = {
    def1: 50,
    def2: 10,
} as unknown as Parameters<typeof calculateDefenseReduction>[1];

const normal = calculateDefenseReduction(
    1000,
    target,
    {
        skillRatio: 100,
        isDefPiercing: false,
        ignoreDef: false,
        simpleDefense: false,
        weaponDefenseType: 0,
    },
);

if (normal.effectiveDef !== 890) {
    throw new Error(
        `Unexpected normal defense result: ${JSON.stringify(normal)}`,
    );
}

const simpleTypeOne = calculateDefenseReduction(
    1000,
    target,
    {
        skillRatio: 100,
        isDefPiercing: false,
        ignoreDef: false,
        simpleDefense: true,
        weaponDefenseType: 1,
    },
);

if (simpleTypeOne.effectiveDef !== 940) {
    throw new Error(
        `Unexpected simple defense type 1 result: ${JSON.stringify(simpleTypeOne)}`,
    );
}

const simpleTypeTwo = calculateDefenseReduction(
    1000,
    target,
    {
        skillRatio: 100,
        isDefPiercing: false,
        ignoreDef: false,
        simpleDefense: true,
        weaponDefenseType: 2,
    },
);

if (simpleTypeTwo.effectiveDef !== 890) {
    throw new Error(
        `Unexpected simple defense type 2 result: ${JSON.stringify(simpleTypeTwo)}`,
    );
}

const ignoreDefSimple = calculateDefenseReduction(
    1000,
    target,
    {
        skillRatio: 100,
        isDefPiercing: false,
        ignoreDef: true,
        simpleDefense: true,
        weaponDefenseType: 1,
    },
);

if (ignoreDefSimple.effectiveDef !== 1000) {
    throw new Error(
        `Ignore DEF applied simple defense: ${JSON.stringify(ignoreDefSimple)}`,
    );
}

const piercingSimple = calculateDefenseReduction(
    1000,
    target,
    {
        skillRatio: 100,
        isDefPiercing: true,
        ignoreDef: false,
        simpleDefense: true,
        weaponDefenseType: 1,
    },
);

if (piercingSimple.effectiveDef !== 940) {
    throw new Error(
        `Piercing was combined with simple defense: ${JSON.stringify(piercingSimple)}`,
    );
}

const truncation = calculateDefenseReduction(
    1000,
    {
        def1: 101,
        def2: 37,
    } as unknown as Parameters<typeof calculateDefenseReduction>[1],
    {
        skillRatio: 100,
        isDefPiercing: false,
        ignoreDef: false,
        simpleDefense: true,
        weaponDefenseType: 1,
    },
);

if (truncation.effectiveDef !== 862) {
    throw new Error(
        `Simple defense truncation is incorrect: ${JSON.stringify(truncation)}`,
    );
}

console.log("Simple Defense tests passed");
