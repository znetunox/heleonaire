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
    "\n=== TESTE 37 — Basic Attack: statusAtk usa Neutral ===",
);

{
    const batk = 61;

    const targetElement = "Fire" as const;
    const targetLevel = 1;

    const ratio =
        attributeTable.getRatio(
            targetLevel,
            "Neutral",
            targetElement,
        );

    const elementalBatk =
        applyRenewalElementRatio(
            batk,
            ratio,
        );

    const statusAtk =
        elementalBatk * 2;

    console.log({
        batk,
        ratio,
        elementalBatk,
        statusAtk,
    });

    assertEqual(
        ratio,
        100,
        "Neutral → Fire ratio",
    );

    assertEqual(
        elementalBatk,
        61,
        "BATK elemental",
    );

    assertEqual(
        statusAtk,
        122,
        "statusAtk",
    );
}

console.log("TESTE 37 PASSOU");

console.log(
    "\n=== TESTE 38 — Basic Attack: weaponAtk usa Fire ===",
);

{
    const weaponAtk = 135;

    const targetElement = "Fire" as const;
    const targetLevel = 1;

    const ratio =
        attributeTable.getRatio(
            targetLevel,
            "Fire",
            targetElement,
        );

    const elementalWeaponAtk =
        applyRenewalElementRatio(
            weaponAtk,
            ratio,
        );

    console.log({
        weaponAtk,
        ratio,
        elementalWeaponAtk,
    });

    assertEqual(
        ratio,
        25,
        "Fire → Fire ratio",
    );

    assertEqual(
        elementalWeaponAtk,
        34,
        "elemental weaponAtk",
    );
}

console.log("TESTE 38 PASSOU");

console.log(
    "\n=== TESTE 39 — Basic Attack: equipAtk usa Fire ===",
);

{
    const equipAtk = 7;

    const targetElement = "Fire" as const;
    const targetLevel = 1;

    const ratio =
        attributeTable.getRatio(
            targetLevel,
            "Fire",
            targetElement,
        );

    const elementalEquipAtk =
        applyRenewalElementRatio(
            equipAtk,
            ratio,
        );

    console.log({
        equipAtk,
        ratio,
        elementalEquipAtk,
    });

    assertEqual(
        ratio,
        25,
        "Fire → Fire ratio",
    );

    assertEqual(
        elementalEquipAtk,
        2,
        "elemental equipAtk",
    );
}

console.log("TESTE 39 PASSOU");

console.log(
    "\n=== TESTE 40 — Basic Attack composition ===",
);

{
    const batk = 61;
    const weaponAtk = 135;
    const equipAtk = 7;

    /*
     * Target:
     * Fire Lv1
     *
     * Basic attack:
     * statusAtk = Neutral
     * weaponAtk = Fire
     * equipAtk = Fire
     */

    const statusRatio =
        attributeTable.getRatio(
            1,
            "Neutral",
            "Fire",
        );

    const weaponRatio =
        attributeTable.getRatio(
            1,
            "Fire",
            "Fire",
        );

    const equipRatio =
        attributeTable.getRatio(
            1,
            "Fire",
            "Fire",
        );

    const elementalBatk =
        applyRenewalElementRatio(
            batk,
            statusRatio,
        );

    const statusAtk =
        elementalBatk * 2;

    const elementalWeaponAtk =
        applyRenewalElementRatio(
            weaponAtk,
            weaponRatio,
        );

    const elementalEquipAtk =
        applyRenewalElementRatio(
            equipAtk,
            equipRatio,
        );

    const total =
        statusAtk +
        elementalWeaponAtk +
        elementalEquipAtk;

    console.log({
        batk,
        weaponAtk,
        equipAtk,

        statusRatio,
        weaponRatio,
        equipRatio,

        elementalBatk,
        statusAtk,

        elementalWeaponAtk,
        elementalEquipAtk,

        total,
    });

    assertEqual(
        statusAtk,
        122,
        "statusAtk",
    );

    assertEqual(
        elementalWeaponAtk,
        34,
        "weaponAtk elemental",
    );

    assertEqual(
        elementalEquipAtk,
        2,
        "equipAtk elemental",
    );

    assertEqual(
        total,
        158,
        "Basic Attack total",
    );
}

console.log("TESTE 40 PASSOU");

console.log(
    "\n=== TESTE 41 — ordem incorreta deve divergir ===",
);

{
    const batk = 61;

    /*
     * CORRETO:
     *
     * Neutral → Fire = 100%
     * 61 × 100% = 61
     * 61 × 2 = 122
     */

    const correct =
        applyRenewalElementRatio(
            batk,
            100,
        ) * 2;

    /*
     * INCORRETO:
     *
     * ×2 primeiro
     * 61 × 2 = 122
     *
     * depois Fire → Fire = 25%
     * 122 → 31
     */

    const incorrect =
        applyRenewalElementRatio(
            batk * 2,
            25,
        );

    console.log({
        batk,
        correct,
        incorrect,
    });

    assertEqual(
        correct,
        122,
        "statusAtk correto",
    );

    assertEqual(
        incorrect,
        31,
        "statusAtk incorreto",
    );

    if (correct === incorrect) {
        throw new Error(
            "A ordem incorreta não produziu resultado diferente",
        );
    }
}

console.log("TESTE 41 PASSOU");

console.log(
    "\n=================================",
);

console.log(
    "BASIC ATTACK ELEMENT — TODOS OS TESTES PASSARAM",
);

console.log(
    "=================================",
);