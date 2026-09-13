import { combatSystem } from "./CombatSystem";
import { resolveBasicAttackComponents } from "./basicAttackResolver";
import type {
    AttackContext,
    AttackFlags,
    CombatClassification,
    PlayerCombatSnapshot,
    MobCombatSnapshot,
} from "./combatTypes";

// -----------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------

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

// -----------------------------------------------------------------
// BASE SNAPSHOTS
// -----------------------------------------------------------------

/**
 * Cria um PlayerCombatSnapshot com cardfix vazio para testes.
 * Todos os campos necessários para o cardfix estão preenchidos.
 */
function createPlayerSnapshot(
    weaponAtkValue: number,
    equipAtkValue: number,
    statusAtkBase: number,
): PlayerCombatSnapshot {
    return {
        characterId: "test-player",
        name: "Test Player",
        jobKey: "KNIGHT",
        race: "Human",
        class: "Knight",
        element: "Neutral",
        race2: [] as const,
        stats: {
            str: 50,
            agi: 20,
            vit: 20,
            int: 10,
            dex: 20,
            luk: 6,
        },
        combatStats: {
            level: 20,
            str: 50,
            agi: 20,
            vit: 20,
            int: 10,
            dex: 20,
            luk: 6,
            batk: 61,
            statusAtk: statusAtkBase * 2, // batk * 2
            patk: 0,
            def1: 0,
            def2: 0,
            res: 0,
            mdef1: 0,
            mdef2: 0,
            hit: 0,
            flee: 0,
            crit: 0,
        },
        equipAtk: equipAtkValue,
        ammoAtk: 0,
        atkRate: 0,
        weaponAtkRate: 0,
        ignoreRes: 0,
        ignoreDefRate: 0,
        ignoreDefByRace: {},
        ignoreDefByClass: {},
        defPiercingByRace: {},
        defPiercingByElement: {},
        defPiercingByClass: {},
        weaponDamageRateByType: {},
        weaponAtkByType: {},
        cardfix: {
            addRace: {},
            addElement: {},
            addSize: {},
            addRace2: {},
            addClass: {},
            subElement: {},
            subDefElement: {},
            subSize: {},
            weaponSubSize: {},
            subRace2: {},
            subRace: {},
            subClass: {},
            defenseAgainstAttackerClass: {},
        },
        weapon: null,
        ammo: null,
    };
}

/**
 * Cria um MobCombatSnapshot para testes.
 */
function createMobSnapshot(
    race: string,
    element: string,
    size: string,
    className: string,
): MobCombatSnapshot {
    return {
        mobDbId: 1,
        aegisName: "TEST_MOB",
        name: "Test Mob",
        stats: {
            level: 10,
            str: 1,
            agi: 1,
            vit: 0,
            int: 1,
            dex: 1,
            luk: 1,
            batk: 10,
            statusAtk: 20,
            patk: 0,
            def1: 0,
            def2: 0,
            res: 0,
            mdef1: 0,
            mdef2: 0,
            hit: 100,
            flee: 100,
            crit: 1,
        },
        attack: 10,
        attack2: 20,
        attackRange: 1,
        size,
        race,
        race2: [] as const,
        class: className,
        element,
        elementLevel: 1,
    };
}

/**
 * Cria um contexto de ataque básico para testes de cardfix.
 */
function createAttackContext(
    player: PlayerCombatSnapshot,
    mob: MobCombatSnapshot,
    flags: AttackFlags = {
        ignoreAttackerCardfix: false,
        ignoreDefenderCardfix: false,
        ignoreElementCardfix: false,
    },
): AttackContext {
    const classification: CombatClassification = {
        attacker: {
            race: player.race,
            class: player.class,
            element: player.element,
            race2: player.race2,
        },
        target: {
            race: mob.race,
            race2: mob.race2,
            class: mob.class,
            element: mob.element as any,
            elementLevel: mob.elementLevel,
            size: mob.size,
        },
        attack: {
            element: "Neutral",
            rangeType: "short",
            type: "weapon",
            hand: "right",
        },
    };

    const components = resolveBasicAttackComponents(player);

    return {
        attacker: player,
        target: mob,
        components,
        attackElement: "Neutral",
        targetElement: mob.element as any,
        targetElementLevel: mob.elementLevel,
        skillRatio: 100,
        skillConstant: 0,
        skillId: 0,
        isCritical: false,
        usesAmmo: false,
        classification,
        flags,
    };
}

// -----------------------------------------------------------------
// TESTE 1: Sem cardfix - valores inalterados
// -----------------------------------------------------------------
console.log("\n=== TESTE 1 — Sem cardfix ===");
{
    const player = createPlayerSnapshot(
        100, // weaponAtk
        50,  // equipAtk
        61,  // statusAtk base
    );

    // Garante que o cardfix está vazio
    player.cardfix = {
        addRace: {},
        addElement: {},
        addSize: {},
        addRace2: {},
        addClass: {},
        subElement: {},
        subDefElement: {},
        subSize: {},
        weaponSubSize: {},
        subRace2: {},
        subRace: {},
        subClass: {},
        defenseAgainstAttackerClass: {},
    };

    const mob = createMobSnapshot("DemiHuman", "Neutral", "Medium", "Normal");
    const context = createAttackContext(player, mob);

    const result = combatSystem.performWeaponAttack(context);

    // O cardfix vazio não deve alterar os componentes
    assertEqual(
        result.components.weaponAtk,
        100,
        "weaponAtk sem cardfix",
    );
    assertEqual(
        result.components.equipAtk,
        50,
        "equipAtk sem cardfix",
    );
    assertEqual(
        result.components.statusAtk,
        122, // 61 * 2
        "statusAtk sem cardfix",
    );
    assertEqual(
        result.components.masteryAtk,
        0,
        "masteryAtk sem cardfix",
    );

    console.log("TESTE 1 PASSOU");
}

// -----------------------------------------------------------------
// TESTE 2: Cardfix por Race - addRace[RC_Demon] = 20
// -----------------------------------------------------------------
console.log("\n=== TESTE 2 — Cardfix por Race (addRace) ===");
{
    const player = createPlayerSnapshot(
        100, // weaponAtk
        50,  // equipAtk
        61,  // statusAtk base
    );

    // Configura cardfix: +20% contra DemiHuman
    player.cardfix = {
        addRace: { DemiHuman: 20 },
        addElement: {},
        addSize: {},
        addRace2: {},
        addClass: {},
        subElement: {},
        subDefElement: {},
        subSize: {},
        weaponSubSize: {},
        subRace2: {},
        subRace: {},
        subClass: {},
        defenseAgainstAttackerClass: {},
    };

    const mob = createMobSnapshot("DemiHuman", "Neutral", "Medium", "Normal");
    const context = createAttackContext(player, mob);

    const result = combatSystem.performWeaponAttack(context);

    // Com +20% de bônus contra DemiHuman:
    // weaponAtk: 100 + (100 * 20 / 100) = 120
    // equipAtk: 50 + (50 * 20 / 100) = 60
    // statusAtk e masteryAtk não são afetados
    assertEqual(
        result.components.weaponAtk,
        120,
        "weaponAtk com addRace +20%",
    );
    assertEqual(
        result.components.equipAtk,
        60,
        "equipAtk com addRace +20%",
    );
    assertEqual(
        result.components.statusAtk,
        122,
        "statusAtk inalterado com cardfix",
    );
    assertEqual(
        result.components.masteryAtk,
        0,
        "masteryAtk inalterado com cardfix",
    );

    console.log("TESTE 2 PASSOU");
}

// -----------------------------------------------------------------
// TESTE 3: Cardfix por Size - addSize[Medium] = 15
// -----------------------------------------------------------------
console.log("\n=== TESTE 3 — Cardfix por Size (addSize) ===");
{
    const player = createPlayerSnapshot(
        100, // weaponAtk
        50,  // equipAtk
        61,  // statusAtk base
    );

    player.cardfix = {
        addRace: {},
        addElement: {},
        addSize: { Medium: 15 },
        addRace2: {},
        addClass: {},
        subElement: {},
        subDefElement: {},
        subSize: {},
        weaponSubSize: {},
        subRace2: {},
        subRace: {},
        subClass: {},
        defenseAgainstAttackerClass: {},
    };

    const mob = createMobSnapshot("DemiHuman", "Neutral", "Medium", "Normal");
    const context = createAttackContext(player, mob);

    const result = combatSystem.performWeaponAttack(context);

    // Com +15% de bônus contra Medium:
    assertEqual(
        result.components.weaponAtk,
        115,
        "weaponAtk com addSize +15%",
    );
    assertEqual(
        result.components.equipAtk,
        57, // 50 + trunc(50 * 15 / 100) = 50 + 7 = 57
        "equipAtk com addSize +15%",
    );

    console.log("TESTE 3 PASSOU");
}

// -----------------------------------------------------------------
// TESTE 4: ignoreAttackerCardfix = true
// -----------------------------------------------------------------
console.log("\n=== TESTE 4 — ignoreAttackerCardfix = true ===");
{
    const player = createPlayerSnapshot(
        100, // weaponAtk
        50,  // equipAtk
        61,  // statusAtk base
    );

    player.cardfix = {
        addRace: { DemiHuman: 50 }, // +50% que deve ser ignorado
        addElement: {},
        addSize: {},
        addRace2: {},
        addClass: {},
        subElement: {},
        subDefElement: {},
        subSize: {},
        weaponSubSize: {},
        subRace2: {},
        subRace: {},
        subClass: {},
        defenseAgainstAttackerClass: {},
    };

    const mob = createMobSnapshot("DemiHuman", "Neutral", "Medium", "Normal");
    const context = createAttackContext(player, mob, {
        ignoreAttackerCardfix: true,
        ignoreDefenderCardfix: false,
        ignoreElementCardfix: false,
    });

    const result = combatSystem.performWeaponAttack(context);

    // Com ignoreAttackerCardfix, os valores devem ser os originais
    assertEqual(
        result.components.weaponAtk,
        100,
        "weaponAtk com ignoreAttackerCardfix",
    );
    assertEqual(
        result.components.equipAtk,
        50,
        "equipAtk com ignoreAttackerCardfix",
    );

    console.log("TESTE 4 PASSOU");
}

// -----------------------------------------------------------------
// TESTE 5: Múltiplos modifiers sequenciais
// -----------------------------------------------------------------
console.log("\n=== TESTE 5 — Múltiplos modifiers sequenciais ===");
{
    const player = createPlayerSnapshot(
        100, // weaponAtk
        50,  // equipAtk
        61,  // statusAtk base
    );

    // Race +20%, Size +15%
    // A aplicação é sequencial com truncamento entre etapas
    player.cardfix = {
        addRace: { DemiHuman: 20 },
        addElement: {},
        addSize: { Medium: 15 },
        addRace2: {},
        addClass: {},
        subElement: {},
        subDefElement: {},
        subSize: {},
        weaponSubSize: {},
        subRace2: {},
        subRace: {},
        subClass: {},
        defenseAgainstAttackerClass: {},
    };

    const mob = createMobSnapshot("DemiHuman", "Neutral", "Medium", "Normal");
    const context = createAttackContext(player, mob);

    const result = combatSystem.performWeaponAttack(context);

    // Aplicação sequencial:
    // Stage 1: Race +20%
    //   weaponAtk: 100 + trunc(100 * 20 / 100) = 120
    //   equipAtk: 50 + trunc(50 * 20 / 100) = 60
    // Stage 2: Size +15%
    //   weaponAtk: 120 + trunc(120 * 15 / 100) = 120 + 18 = 138
    //   equipAtk: 60 + trunc(60 * 15 / 100) = 60 + 9 = 69
    assertEqual(
        result.components.weaponAtk,
        138,
        "weaponAtk com múltiplos modifiers",
    );
    assertEqual(
        result.components.equipAtk,
        69,
        "equipAtk com múltiplos modifiers",
    );

    console.log("TESTE 5 PASSOU");
}

// -----------------------------------------------------------------
// TESTE 6: Verificação de que statusAtk e masteryAtk NÃO são afetados
// -----------------------------------------------------------------
console.log("\n=== TESTE 6 — statusAtk e masteryAtk NÃO são afetados ===");
{
    const player = createPlayerSnapshot(
        100,  // weaponAtk
        50,   // equipAtk
        61,   // statusAtk base
    );

    // cardfix forte
    player.cardfix = {
        addRace: { DemiHuman: 50 },
        addElement: {},
        addSize: {},
        addRace2: {},
        addClass: {},
        subElement: {},
        subDefElement: {},
        subSize: {},
        weaponSubSize: {},
        subRace2: {},
        subRace: {},
        subClass: {},
        defenseAgainstAttackerClass: {},
    };

    const mob = createMobSnapshot("DemiHuman", "Neutral", "Medium", "Normal");
    const context = createAttackContext(player, mob);

    const result = combatSystem.performWeaponAttack(context);

    // Com +50% de bônus:
    // weaponAtk: 100 + 50 = 150
    // equipAtk: 50 + 25 = 75
    // statusAtk: deve permanecer 122 (61 * 2)
    // masteryAtk: deve permanecer 25
    assertEqual(
        result.components.weaponAtk,
        150,
        "weaponAtk modificado",
    );
    assertEqual(
        result.components.equipAtk,
        75,
        "equipAtk modificado",
    );
    assertEqual(
        result.components.statusAtk,
        122,
        "statusAtk NÃO modificado pelo cardfix",
    );
    assertEqual(
        result.components.masteryAtk,
        0,
        "masteryAtk NÃO modificado pelo cardfix",
    );

    console.log("TESTE 6 PASSOU");
}

// -----------------------------------------------------------------
// RESULTADO
// -----------------------------------------------------------------

console.log("\n=======================================================");
console.log("ATACKER CARDFIX INTEGRATION — TODOS OS TESTES PASSARAM");
console.log("=======================================================\n");
