import prisma from "./src/db/prisma";
import { StatSystem } from "./src/game/stats/StatSystem";
import { calculatePostDefenseDamage } from "./src/game/combat/postDefenseCalculator";
import { resolveBasicAttackComponents } from "./src/game/combat/basicAttackResolver";
import type { PlayerCombatSnapshot } from "./src/game/combat/combatTypes";

async function main() {
    const statSystem = new StatSystem(prisma);

    // ---------------------------------------------------------
    // TESTE 1 — BATK / StatusATK
    // ---------------------------------------------------------

    const stats = {
        str: 50,
        agi: 20,
        vit: 20,
        int: 10,
        dex: 20,
        luk: 6,
    };

    const derived = statSystem.calculateDerivedStats(
        stats,
        20,
        {},
    );

    console.log("\n=== TESTE 1 — BATK / StatusATK ===");
    console.table({
        batk: derived.batk,
        statusAtk: derived.statusAtk,
        expectedBatk:
            50 +
            Math.floor(20 / 5) +
            Math.floor(6 / 3) +
            Math.floor(20 / 4),
        expectedStatusAtk:
            (
                50 +
                Math.floor(20 / 5) +
                Math.floor(6 / 3) +
                Math.floor(20 / 4)
            ) * 2,
    });

    if (derived.batk !== 61) {
    throw new Error(
        `BATK incorreto: esperado 61, recebido ${derived.batk}`,
    );
}

if (derived.statusAtk !== 122) {
    throw new Error(
        `StatusATK incorreto: esperado 122, recebido ${derived.statusAtk}`,
    );
}

    console.log("TESTE 1 PASSOU");


    // ---------------------------------------------------------
    // TESTE 2 — Resolver sem arma
    // ---------------------------------------------------------

    const playerWithoutWeapon = {
        characterId: "test-character",
        name: "Test",
        jobKey: "KNIGHT",
        stats,

        combatStats: {
            level: 20,

            str: stats.str,
            agi: stats.agi,
            vit: stats.vit,
            int: stats.int,
            dex: stats.dex,
            luk: stats.luk,

            batk: derived.batk,
            statusAtk: derived.statusAtk,
            patk: derived.patk,

            def1: derived.def1,
            def2: derived.def2,
            res: derived.res,

            mdef1: derived.mdef1,
            mdef2: derived.mdef2,

            hit: derived.hit,
            flee: derived.flee,
            crit: derived.crit,
        },

        equipAtk: 0,
        ammoAtk: 0,

        atkRate: 0,
        weaponAtkRate: 0,
        weaponDamageRate: 0,

        weapon: null,
        ammo: null,
    } satisfies PlayerCombatSnapshot;

    const componentsWithoutWeapon =
        resolveBasicAttackComponents(
            playerWithoutWeapon,
        );

    console.log("\n=== TESTE 2 — Resolver sem arma ===");
    console.table(componentsWithoutWeapon);

    if (componentsWithoutWeapon.statusAtk !== 122) {
        throw new Error(
            `Resolver statusAtk incorreto: esperado 124, recebido ${componentsWithoutWeapon.statusAtk}`,
        );
    }

    if (componentsWithoutWeapon.weaponAtk !== 0) {
        throw new Error(
            `weaponAtk incorreto: esperado 0, recebido ${componentsWithoutWeapon.weaponAtk}`,
        );
    }

    console.log("TESTE 2 PASSOU");


    // ---------------------------------------------------------
    // TESTE 3 — Resolver com arma
    // ---------------------------------------------------------

    const playerWithWeapon: PlayerCombatSnapshot = {
        ...playerWithoutWeapon,

        equipAtk: 7,

        weapon: {
            itemId: 1,
            aegisName: "TEST_SWORD",
            name: "Test Sword",
            slot: "rightHand",
            inventoryId: null,

            attack: 100,
            weaponLevel: 1,
            weaponType: "Sword",
            range: 1,

            refineLevel: 0,
            refineBonus: 10,
            overRefineBonus: 0,
        },
    };

    const componentsWithWeapon =
        resolveBasicAttackComponents(
            playerWithWeapon,
            {
                randomValue: 0.5,
                overRefineRandomValue: 0.5,
            },
        );

    console.log("\n=== TESTE 3 — Resolver com arma ===");
    console.table(componentsWithWeapon);

    if (componentsWithWeapon.statusAtk !== 122) {
        throw new Error(
            `statusAtk incorreto: esperado 124, recebido ${componentsWithWeapon.statusAtk}`,
        );
    }

    if (componentsWithWeapon.weaponAtk !== 135) {
        throw new Error(
            `weaponAtk incorreto: esperado 135, recebido ${componentsWithWeapon.weaponAtk}`,
        );
    }

    if (componentsWithWeapon.equipAtk !== 7) {
        throw new Error(
            `equipAtk incorreto: esperado 7, recebido ${componentsWithWeapon.equipAtk}`,
        );
    }

    console.log("TESTE 3 PASSOU");


    // ---------------------------------------------------------
    // RESULTADO
    // ---------------------------------------------------------

    console.log("\n=================================");
    console.log("TODOS OS TESTES PASSARAM");
    console.log("=================================\n");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { calculateAttackComposition } from "./src/game/combat/attackCalculator";

const attackResult = calculateAttackComposition(
    {
        statusAtk: 122,
        weaponAtk: 135,
        equipAtk: 7,
        masteryAtk: 0,
        patk: 0,
    },
    0,      // patk
    0,      // atkRate
    100,    // skillRatio
    0,      // skillConstant
);

console.log("\n=== TESTE 4 — Attack Composition ===");
console.table(attackResult);

if (attackResult.baseDamage !== 264) {
    throw new Error(
        `baseDamage incorreto: esperado 264, recebido ${attackResult.baseDamage}`,
    );
}

if (attackResult.postPatkDamage !== 264) {
    throw new Error(
        `postPatkDamage incorreto: esperado 264, recebido ${attackResult.postPatkDamage}`,
    );
}

if (attackResult.masteryDamage !== 264) {
    throw new Error(
        `masteryDamage incorreto: esperado 264, recebido ${attackResult.masteryDamage}`,
    );
}

if (attackResult.skillDamage !== 264) {
    throw new Error(
        `skillDamage incorreto: esperado 264, recebido ${attackResult.skillDamage}`,
    );
}

if (attackResult.finalDamage !== 264) {
    throw new Error(
        `finalDamage incorreto: esperado 264, recebido ${attackResult.finalDamage}`,
    );
}

console.log("TESTE 4 PASSOU");

const attackRateResult = calculateAttackComposition(
    {
        statusAtk: 122,
        weaponAtk: 135,
        equipAtk: 7,
        masteryAtk: 0,
        patk: 0,
    },
    0,
    50,
    100,
    0,
);

console.log("\n=== TESTE 5 — AtkRate ===");
console.table(attackRateResult);

if (attackRateResult.baseDamage !== 335) {
    throw new Error(
        `baseDamage incorreto: esperado 335, recebido ${attackRateResult.baseDamage}`,
    );
}

console.log("TESTE 5 PASSOU");

const patkResult = calculateAttackComposition(
    {
        statusAtk: 122,
        weaponAtk: 135,
        equipAtk: 7,
        masteryAtk: 0,
        patk: 0,
    },
    20,
    0,
    100,
    0,
);

console.log("\n=== TESTE 6 — P.ATK ===");
console.table(patkResult);

if (patkResult.postPatkDamage !== 316) {
    throw new Error(
        `postPatkDamage incorreto: esperado 316, recebido ${patkResult.postPatkDamage}`,
    );
}

console.log("TESTE 6 PASSOU");

const masteryResult = calculateAttackComposition(
    {
        statusAtk: 122,
        weaponAtk: 135,
        equipAtk: 7,
        masteryAtk: 25,
        patk: 0,
    },
    20,
    0,
    100,
    0,
);

console.log("\n=== TESTE 7 — MasteryATK ===");
console.table(masteryResult);

if (masteryResult.masteryDamage !== 341) {
    throw new Error(
        `masteryDamage incorreto: esperado 341, recebido ${masteryResult.masteryDamage}`,
    );
}

console.log("TESTE 7 PASSOU");

import { calculateDefenseReduction } from "./src/game/combat/defenseCalculator";

const targetCombatStats = {
    level: 20,

    str: 0,
    agi: 0,
    vit: 0,
    int: 0,
    dex: 0,
    luk: 0,

    batk: 0,
    statusAtk: 0,
    patk: 0,

    def1: 50,
    def2: 20,
    res: 0,

    mdef1: 0,
    mdef2: 0,

    hit: 0,
    flee: 0,
    crit: 0,
};

const normalDefenseResult = calculateDefenseReduction(
    341,
    targetCombatStats,
    {
        skillRatio: 100,
        isDefPiercing: false,
        ignoreDef: false,
    },
);

console.log("\n=== TESTE 8 — Renewal DEF normal ===");
console.table(normalDefenseResult);

if (normalDefenseResult.effectiveDef !== 286) {
    throw new Error(
        `DEF normal incorreta: esperado 286, recebido ${normalDefenseResult.effectiveDef}`,
    );
}

console.log("TESTE 8 PASSOU");


const ignoreDefenseResult = calculateDefenseReduction(
    341,
    targetCombatStats,
    {
        skillRatio: 100,
        isDefPiercing: false,
        ignoreDef: true,
    },
);

console.log("\n=== TESTE 9 — Ignore DEF ===");
console.table(ignoreDefenseResult);

if (ignoreDefenseResult.effectiveDef !== 341) {
    throw new Error(
        `Ignore DEF incorreto: esperado 341, recebido ${ignoreDefenseResult.effectiveDef}`,
    );
}

console.log("TESTE 9 PASSOU");


const piercingDefenseResult = calculateDefenseReduction(
    341,
    targetCombatStats,
    {
        skillRatio: 100,
        isDefPiercing: true,
        ignoreDef: false,
    },
);

console.log("\n=== TESTE 10 — DEF Piercing ===");
console.table(piercingDefenseResult);

if (piercingDefenseResult.effectiveDef !== 366) {
    throw new Error(
        `DEF piercing incorreta: esperado 366, recebido ${piercingDefenseResult.effectiveDef}`,
    );
}

console.log("TESTE 10 PASSOU");

const postDefenseNormalResult = calculatePostDefenseDamage(286);

console.log("\n=== TESTE 11 — Post-DEF normal ===");
console.table(postDefenseNormalResult);

if (postDefenseNormalResult.damage !== 286) {
    throw new Error(
        `Post-DEF incorreto: esperado 286, recebido ${postDefenseNormalResult.damage}`,
    );
}

console.log("TESTE 11 PASSOU");


const postDefenseMinimumResult = calculatePostDefenseDamage(0);

console.log("\n=== TESTE 12 — Post-DEF dano mínimo ===");
console.table(postDefenseMinimumResult);

if (postDefenseMinimumResult.damage !== 1) {
    throw new Error(
        `Dano mínimo incorreto: esperado 1, recebido ${postDefenseMinimumResult.damage}`,
    );
}

console.log("TESTE 12 PASSOU");