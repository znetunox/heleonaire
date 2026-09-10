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

console.log(
    "\n=== TESTE 32 — Equip ATK Neutral → Neutral ===",
);

{
    const equipAtk = 20;

    const ratio =
        attributeTable.getRatio(
            1,
            "Neutral",
            "Neutral",
        );

    const result =
        applyRenewalElementRatio(
            equipAtk,
            ratio,
        );

    console.log({
        equipAtk,
        ratio,
        result,
    });

    assertEqual(
        ratio,
        100,
        "Neutral → Neutral ratio",
    );

    assertEqual(
        result,
        20,
        "Neutral → Neutral Equip ATK",
    );
}

console.log("TESTE 32 PASSOU");

console.log(
    "\n=== TESTE 33 — Equip ATK Fire → Fire ===",
);

{
    const equipAtk = 20;

    const ratio =
        attributeTable.getRatio(
            1,
            "Fire",
            "Fire",
        );

    const result =
        applyRenewalElementRatio(
            equipAtk,
            ratio,
        );

    console.log({
        equipAtk,
        ratio,
        result,
    });

    assertEqual(
        ratio,
        25,
        "Fire → Fire ratio",
    );

    assertEqual(
        result,
        5,
        "Fire → Fire Equip ATK",
    );
}

console.log("TESTE 33 PASSOU");

console.log(
    "\n=== TESTE 34 — Equip ATK Fire → Earth ===",
);

{
    const equipAtk = 20;

    const ratio =
        attributeTable.getRatio(
            1,
            "Fire",
            "Earth",
        );

    const result =
        applyRenewalElementRatio(
            equipAtk,
            ratio,
        );

    console.log({
        equipAtk,
        ratio,
        result,
    });

    assertEqual(
        ratio,
        150,
        "Fire → Earth ratio",
    );

    assertEqual(
        result,
        30,
        "Fire → Earth Equip ATK",
    );
}

console.log("TESTE 34 PASSOU");

console.log(
    "\n=== TESTE 35 — Equip ATK Water → Fire ===",
);

{
    const equipAtk = 20;

    const ratio =
        attributeTable.getRatio(
            1,
            "Water",
            "Fire",
        );

    const result =
        applyRenewalElementRatio(
            equipAtk,
            ratio,
        );

    console.log({
        equipAtk,
        ratio,
        result,
    });

    assertEqual(
        ratio,
        150,
        "Water → Fire ratio",
    );

    assertEqual(
        result,
        30,
        "Water → Fire Equip ATK",
    );
}

console.log("TESTE 35 PASSOU");

console.log(
    "\n=== TESTE 36 — Equip ATK rounding ===",
);

{
    const equipAtk = 21;

    const ratio =
        attributeTable.getRatio(
            1,
            "Fire",
            "Fire",
        );

    const result =
        applyRenewalElementRatio(
            equipAtk,
            ratio,
        );

    console.log({
        equipAtk,
        ratio,
        result,
    });

    /*
     * 21 × (100 - 25) / 100
     * = 1575 / 100
     * = 15.75
     *
     * C++ truncation → 15
     *
     * 21 - 15 = 6
     */

    assertEqual(
        result,
        6,
        "Fire → Fire rounding",
    );
}

console.log("TESTE 36 PASSOU");

console.log(
    "\n=================================",
);

console.log(
    "EQUIP ATK ELEMENTAL — TODOS OS TESTES PASSARAM",
);

console.log(
    "=================================",
);