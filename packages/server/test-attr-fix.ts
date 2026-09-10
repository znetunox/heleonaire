import {
    parseAttributeTable,
    applyRenewalElementRatio,
} from "./src/data/rathena/parsers/attrFixParser";

import { resolve } from "path";

const RATHENA_PATH =
    resolve(
        process.cwd(),
        "../../rathena-master/db/re",
    );

const table =
    parseAttributeTable(
        resolve(
            RATHENA_PATH,
            "attr_fix.yml",
        ),
    );

console.log(
    "\n=== TESTE 13 — ATTRIBUTE_DB estrutura ===",
);

console.table({
    version: table.version,
    levels: table.levels.length,
    elements: 10,
    combinations: 4 * 10 * 10,
});

if (table.version !== 1) {
    throw new Error(
        `Version incorreta: ${table.version}`,
    );
}

if (table.levels.length !== 4) {
    throw new Error(
        `Quantidade de níveis incorreta: ${table.levels.length}`,
    );
}

console.log(
    "TESTE 13 PASSOU",
);


console.log(
    "\n=== TESTE 14 — Neutral → Neutral ===",
);

for (let level = 1; level <= 4; level++) {
    const ratio =
        table.getRatio(
            level,
            "Neutral",
            "Neutral",
        );

    console.log(
        `Level ${level}: ${ratio}%`,
    );

    if (ratio !== 100) {
        throw new Error(
            `Neutral → Neutral L${level}: esperado 100, recebido ${ratio}`,
        );
    }
}

console.log(
    "TESTE 14 PASSOU",
);


console.log(
    "\n=== TESTE 15 — Fire → Earth ===",
);

const expectedFireEarth = [
    150,
    175,
    200,
    200,
];

for (let level = 1; level <= 4; level++) {
    const ratio =
        table.getRatio(
            level,
            "Fire",
            "Earth",
        );

    console.log(
        `Level ${level}: ${ratio}%`,
    );

    if (
        ratio !==
        expectedFireEarth[level - 1]
    ) {
        throw new Error(
            `Fire → Earth L${level}: esperado ${expectedFireEarth[level - 1]}, recebido ${ratio}`,
        );
    }
}

console.log(
    "TESTE 15 PASSOU",
);


console.log(
    "\n=== TESTE 16 — Fire → Fire ===",
);

const expectedFireFire = [
    25,
    0,
    0,
    0,
];

for (let level = 1; level <= 4; level++) {
    const ratio =
        table.getRatio(
            level,
            "Fire",
            "Fire",
        );

    console.log(
        `Level ${level}: ${ratio}%`,
    );

    if (
        ratio !==
        expectedFireFire[level - 1]
    ) {
        throw new Error(
            `Fire → Fire L${level}: esperado ${expectedFireFire[level - 1]}, recebido ${ratio}`,
        );
    }
}

console.log(
    "TESTE 16 PASSOU",
);


console.log(
    "\n=== TESTE 17 — Renewal rounding ===",
);

const rounded =
    applyRenewalElementRatio(
        61,
        25,
    );

console.log({
    damage: 61,
    ratio: 25,
    result: rounded,
});

if (rounded !== 16) {
    throw new Error(
        `Rounding Renewal incorreto: esperado 16, recebido ${rounded}`,
    );
}

console.log(
    "TESTE 17 PASSOU",
);


console.log(
    "\n=================================",
);

console.log(
    "ATTRIBUTE_DB — TODOS OS TESTES PASSARAM",
);

console.log(
    "=================================",
);