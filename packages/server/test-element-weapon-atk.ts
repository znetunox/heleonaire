import {
    parseAttributeTable,
    applyRenewalElementRatio,
} from "./src/data/rathena/parsers/attrFixParser";

import {
    calculateWeaponAttack,
} from "./src/game/combat/weaponAttackCalculator";

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

const attacker = {
    level: 20,
    str: 50,
    agi: 20,
    vit: 20,
    int: 10,
    dex: 20,
    luk: 6,
    batk: 61,
    statusAtk: 122,
    patk: 0,
    def1: 0,
    def2: 0,
    res: 0,
    mdef1: 0,
    mdef2: 0,
    hit: 0,
    flee: 0,
    crit: 0,
};

const weapon = {
    itemId: 1,
    aegisName: "TEST_SWORD",
    name: "Test Sword",
    slot: "weapon",
    inventoryId: null,
    attack: 100,
    weaponLevel: 1,
    weaponType: "Sword",
    range: 1,
    refineLevel: 0,
    refineBonus: 10,
    overRefineBonus: 0,
};

console.log(
    "\n=== TESTE 28 — Weapon ATK antes do elemento ===",
);

{
    const result =
        calculateWeaponAttack(
            attacker,
            weapon,
            0,
            0.5,
            0.5,
        );

    console.log(result);

    assertEqual(
        result.value,
        135,
        "Weapon ATK base",
    );
}

console.log("TESTE 28 PASSOU");

console.log(
    "\n=== TESTE 29 — Weapon ATK Fire → Neutral ===",
);

{
    const weaponAttack =
        calculateWeaponAttack(
            attacker,
            weapon,
            0,
            0.5,
            0.5,
        ).value;

    const ratio =
        attributeTable.getRatio(
            1,
            "Fire",
            "Neutral",
        );

    const elementalWeaponAttack =
        applyRenewalElementRatio(
            weaponAttack,
            ratio,
        );

    console.log({
        weaponAttack,
        ratio,
        elementalWeaponAttack,
    });

    assertEqual(
        ratio,
        100,
        "Fire → Neutral ratio",
    );

    assertEqual(
        elementalWeaponAttack,
        135,
        "Fire → Neutral Weapon ATK",
    );
}

console.log("TESTE 29 PASSOU");

console.log(
    "\n=== TESTE 30 — Weapon ATK Fire → Fire ===",
);

{
    const weaponAttack =
        calculateWeaponAttack(
            attacker,
            weapon,
            0,
            0.5,
            0.5,
        ).value;

    const ratio =
        attributeTable.getRatio(
            1,
            "Fire",
            "Fire",
        );

    const elementalWeaponAttack =
        applyRenewalElementRatio(
            weaponAttack,
            ratio,
        );

    console.log({
        weaponAttack,
        ratio,
        elementalWeaponAttack,
    });

    assertEqual(
        ratio,
        25,
        "Fire → Fire ratio",
    );

    assertEqual(
        elementalWeaponAttack,
        34,
        "Fire → Fire Weapon ATK",
    );
}

console.log("TESTE 30 PASSOU");

console.log(
    "\n=== TESTE 31 — Weapon ATK Fire → Earth ===",
);

{
    const weaponAttack =
        calculateWeaponAttack(
            attacker,
            weapon,
            0,
            0.5,
            0.5,
        ).value;

    const ratio =
        attributeTable.getRatio(
            1,
            "Fire",
            "Earth",
        );

    const elementalWeaponAttack =
        applyRenewalElementRatio(
            weaponAttack,
            ratio,
        );

    console.log({
        weaponAttack,
        ratio,
        elementalWeaponAttack,
    });

    assertEqual(
        ratio,
        150,
        "Fire → Earth ratio",
    );

    assertEqual(
        elementalWeaponAttack,
        202,
        "Fire → Earth Weapon ATK",
    );
}

console.log("TESTE 31 PASSOU");

console.log(
    "\n=================================",
);

console.log(
    "WEAPON ATK ELEMENTAL — TODOS OS TESTES PASSARAM",
);

console.log(
    "=================================",
);