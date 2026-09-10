import {
    calculateWeaponAttack,
} from "./src/game/combat/weaponAttackCalculator";

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
    hit: 195,
    flee: 150,
    crit: 3,
};

const weapon = {
    itemId: 1,
    aegisName: "TEST_WEAPON",
    name: "Test Weapon",
    slot: "RIGHT_HAND",
    inventoryId: null,
    attack: 100,
    weaponLevel: 1,
    weaponType: "Sword",
    range: 1,
    refineLevel: 0,
    refineBonus: 0,
    overRefineBonus: 0,
};

console.log("=== +0 ===");

console.log(
    calculateWeaponAttack(
        attacker,
        weapon,
        0,
        0,
        0,
    ),
);

console.log("=== +7 equivalente ===");

console.log(
    calculateWeaponAttack(
        attacker,
        {
            ...weapon,
            refineLevel: 7,
            refineBonus: 14,
            overRefineBonus: 0,
        },
        0,
        0,
        0,
    ),
);

console.log("=== +8 equivalente com RandomBonus ===");

console.log(
    calculateWeaponAttack(
        attacker,
        {
            ...weapon,
            refineLevel: 8,
            refineBonus: 16,
            overRefineBonus: 3,
        },
        0,
        0,
        0.5,
    ),
);
