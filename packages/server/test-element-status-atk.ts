import {
    parseAttributeTable,
    applyRenewalElementRatio,
} from "./src/data/rathena/parsers/attrFixParser";

import {
    RATHENA_DB_RE,
} from "./src/data/rathena/paths";

const attributeTable =
    parseAttributeTable(
        `${RATHENA_DB_RE}/attr_fix.yml`,
    );

function assertEqual(
    actual: number,
    expected: number,
    message: string,
): void {
    if (actual !== expected) {
        throw new Error(
            `${message}: esperado ${expected}, recebido ${actual}`,
        );
    }
}

function calculateStatusAtkRenewal(
    batk: number,
    attackElement:
        | "Neutral"
        | "Water"
        | "Earth"
        | "Fire"
        | "Wind"
        | "Poison"
        | "Holy"
        | "Dark"
        | "Ghost"
        | "Undead",
    targetElement:
        | "Neutral"
        | "Water"
        | "Earth"
        | "Fire"
        | "Wind"
        | "Poison"
        | "Holy"
        | "Dark"
        | "Ghost"
        | "Undead",
    targetElementLevel: number,
): number {
    const ratio =
        attributeTable.getRatio(
            targetElementLevel,
            attackElement,
            targetElement,
        );

    const elementalBatk =
        applyRenewalElementRatio(
            batk,
            ratio,
        );

    return elementalBatk * 2;
}

console.log(
    "\n=== TESTE 24 — statusAtk Neutral → Neutral ===",
);

{
    const batk = 61;

    const result =
        calculateStatusAtkRenewal(
            batk,
            "Neutral",
            "Neutral",
            1,
        );

    console.log({
        batk,
        elementalBatk: 61,
        statusAtk: result,
    });

    assertEqual(
        result,
        122,
        "Neutral → Neutral statusAtk",
    );
}

console.log("TESTE 24 PASSOU");

console.log(
    "\n=== TESTE 25 — statusAtk Fire → Fire ===",
);

{
    const batk = 61;

    const ratio =
        attributeTable.getRatio(
            1,
            "Fire",
            "Fire",
        );

    const elementalBatk =
        applyRenewalElementRatio(
            batk,
            ratio,
        );

    const result =
        elementalBatk * 2;

    console.log({
        batk,
        ratio,
        elementalBatk,
        statusAtk: result,
    });

    assertEqual(
        ratio,
        25,
        "Fire → Fire ratio",
    );

    assertEqual(
        elementalBatk,
        16,
        "Fire → Fire BATK elemental",
    );

    assertEqual(
        result,
        32,
        "Fire → Fire statusAtk",
    );
}

console.log("TESTE 25 PASSOU");

console.log(
    "\n=== TESTE 26 — statusAtk Fire → Earth ===",
);

{
    const batk = 61;

    const ratio =
        attributeTable.getRatio(
            1,
            "Fire",
            "Earth",
        );

    const elementalBatk =
        applyRenewalElementRatio(
            batk,
            ratio,
        );

    const result =
        elementalBatk * 2;

    console.log({
        batk,
        ratio,
        elementalBatk,
        statusAtk: result,
    });

    assertEqual(
        ratio,
        150,
        "Fire → Earth ratio",
    );

    assertEqual(
    elementalBatk,
    91,
    "Fire → Earth BATK elemental",
);

assertEqual(
    result,
    182,
    "Fire → Earth statusAtk",
);
}

console.log("TESTE 26 PASSOU");

console.log(
    "\n=== TESTE 27 — ordem incorreta deve produzir resultado diferente ===",
);

{
    const batk = 61;
    const statusAtk = batk * 2;

    const ratio =
        attributeTable.getRatio(
            1,
            "Fire",
            "Fire",
        );

    const correto =
        applyRenewalElementRatio(
            batk,
            ratio,
        ) * 2;

    const incorreto =
        applyRenewalElementRatio(
            statusAtk,
            ratio,
        );

    console.log({
        batk,
        statusAtk,
        ratio,
        correto,
        incorreto,
    });

    assertEqual(
        correto,
        32,
        "Ordem correta",
    );

    assertEqual(
        incorreto,
        31,
        "Demonstração da ordem incorreta",
    );

    if (correto === incorreto) {
        throw new Error(
            "O teste não demonstrou diferença entre as duas ordens",
        );
    }
}

console.log("TESTE 27 PASSOU");

console.log(
    "\n=================================",
);

console.log(
    "STATUS ATK ELEMENTAL — TODOS OS TESTES PASSARAM",
);

console.log(
    "=================================",
);