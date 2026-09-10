import {
    parseAttributeTable,
} from "./src/data/rathena/parsers/attrFixParser";

import {
    calculateElementDamage,
} from "./src/game/combat/elementCalculator";

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

console.log(
    "\n=== TESTE 18 — Neutral → Neutral ===",
);

{
    const result =
        calculateElementDamage(
            100,
            "Neutral",
            "Neutral",
            1,
            attributeTable,
        );

    console.log(result);

    assertEqual(
        result.ratio,
        100,
        "Neutral → Neutral ratio",
    );

    assertEqual(
        result.outputDamage,
        100,
        "Neutral → Neutral dano",
    );
}

console.log("TESTE 18 PASSOU");

console.log(
    "\n=== TESTE 19 — Fire → Earth ===",
);

{
    const expected = [
        150,
        175,
        200,
        200,
    ];

    for (let level = 1; level <= 4; level++) {
        const result =
            calculateElementDamage(
                100,
                "Fire",
                "Earth",
                level,
                attributeTable,
            );

        console.log(
            `Level ${level}:`,
            result.outputDamage,
        );

        assertEqual(
            result.outputDamage,
            expected[level - 1],
            `Fire → Earth L${level}`,
        );
    }
}

console.log("TESTE 19 PASSOU");

console.log(
    "\n=== TESTE 20 — Fire → Fire ===",
);

{
    const expected = [
        25,
        0,
        0,
        0,
    ];

    for (let level = 1; level <= 4; level++) {
        const result =
            calculateElementDamage(
                100,
                "Fire",
                "Fire",
                level,
                attributeTable,
            );

        console.log(
            `Level ${level}:`,
            result.outputDamage,
        );

        assertEqual(
            result.outputDamage,
            expected[level - 1],
            `Fire → Fire L${level}`,
        );
    }
}

console.log("TESTE 20 PASSOU");

console.log(
    "\n=== TESTE 21 — Water → Fire ===",
);

{
    const expected = [
        150,
        175,
        200,
        200,
    ];

    for (let level = 1; level <= 4; level++) {
        const result =
            calculateElementDamage(
                100,
                "Water",
                "Fire",
                level,
                attributeTable,
            );

        console.log(
            `Level ${level}:`,
            result.outputDamage,
        );

        assertEqual(
            result.outputDamage,
            expected[level - 1],
            `Water → Fire L${level}`,
        );
    }
}

console.log("TESTE 21 PASSOU");

console.log(
    "\n=== TESTE 22 — Ratio 0% ===",
);

{
    const result =
        calculateElementDamage(
            123,
            "Fire",
            "Fire",
            2,
            attributeTable,
        );

    console.log(result);

    assertEqual(
        result.ratio,
        0,
        "Fire → Fire L2 ratio",
    );

    assertEqual(
        result.outputDamage,
        0,
        "Fire → Fire L2 dano",
    );
}

console.log("TESTE 22 PASSOU");

console.log(
    "\n=== TESTE 23 — Renewal truncation >100% ===",
);

{
    const result =
        calculateElementDamage(
            101,
            "Fire",
            "Earth",
            1,
            attributeTable,
        );

    console.log(result);

    assertEqual(
        result.ratio,
        150,
        "Fire → Earth L1 ratio",
    );

    assertEqual(
        result.outputDamage,
        151,
        "Fire → Earth L1 dano",
    );
}

console.log("TESTE 23 PASSOU");

console.log(
    "\n=================================",
);

console.log(
    "ELEMENT CALCULATOR — TODOS OS TESTES PASSARAM",
);

console.log(
    "=================================",
);