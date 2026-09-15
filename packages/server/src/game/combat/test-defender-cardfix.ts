import { combatSystem } from "./CombatSystem";
import { resolveBasicAttackComponents } from "./basicAttackResolver";
import type {
    AttackContext,
    AttackFlags,
    CombatClassification,
    PlayerCombatSnapshot,
    MobCombatSnapshot,
    CardfixModifiers,
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

/**
 * Cria um PlayerCombatSnapshot com cardfix vazio para testes.
 */
function createPlayerSnapshot(): PlayerCombatSnapshot {
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
        traitStats: {
            pow: 1,
            sta: 1,
            wis: 1,
            spl: 1,
            con: 1,
            crt: 1,
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
        },
        equipAtk: 0,
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
 * Cria um MobCombatSnapshot para testes de defender cardfix.
 */
function createMobSnapshot(cardfix?: Partial<CardfixModifiers>): MobCombatSnapshot {
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
            hit: 0,
            flee: 0,
            crit: 0,
        },
        attack: 0,
        attack2: 0,
        attackRange: 1,
        size: "Medium",
        race: "DemiHuman",
        race2: [] as const,
        class: "Normal",
        element: "Neutral",
        elementLevel: 1,
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
            ...cardfix,
        },
    };
}

/**
 * Cria um contexto de ataque básico para testes de defender cardfix.
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
// TESTE 1: Sem defender cardfix - dano inalterado
// -----------------------------------------------------------------
console.log("\n=== TESTE 1 — Sem defender cardfix ===");
{
    const player = createPlayerSnapshot();
    const mob = createMobSnapshot();
    const context = createAttackContext(player, mob);

    const result = combatSystem.performWeaponAttack(context);

    // Sem defender cardfix, o dano deve passar diretamente
    // O dano base é: statusAtk(122) + weaponAtk(0) + equipAtk(0) = 122
    // Sem RES/DEF/Post-DEF/Element: 122
    // Result.damage deve ser 122
    assertEqual(
        result.damage,
        122,
        "Dano sem defender cardfix",
    );

    console.log("TESTE 1 PASSOU");
}

// -----------------------------------------------------------------
// TESTE 2: subRace[Human] = 20 (defensor recebe -20% de Human)
// -----------------------------------------------------------------
console.log("\n=== TESTE 2 — Defender Cardfix por Race (subRace) ===");
{
    const player = createPlayerSnapshot();
    const mob = createMobSnapshot({
        subRace: { Human: 20 },
    });
    const context = createAttackContext(player, mob);

    const result = combatSystem.performWeaponAttack(context);

    // Dano base antes do defender cardfix: 122
    // Com subRace[Human] = 20:
    // damage = 122 - trunc(122 * 20 / 100) = 122 - 24 = 98
    assertEqual(
        result.damage,
        98,
        "Dano com subRace -20% contra Human",
    );

    console.log("TESTE 2 PASSOU");
}

// -----------------------------------------------------------------
// TESTE 3: subSize[Medium] = 10
// -----------------------------------------------------------------
console.log("\n=== TESTE 3 — Defender Cardfix por Size (subSize) ===");
{
    const player = createPlayerSnapshot();
    const mob = createMobSnapshot({
        subSize: { Medium: 10 },
    });
    const context = createAttackContext(player, mob);

    const result = combatSystem.performWeaponAttack(context);

    // Dano base: 122
    // Com subSize[Medium] = 10:
    // damage = 122 - trunc(122 * 10 / 100) = 122 - 12 = 110
    assertEqual(
        result.damage,
        110,
        "Dano com subSize -10% contra Medium",
    );

    console.log("TESTE 3 PASSOU");
}

// -----------------------------------------------------------------
// TESTE 4: subClass[Knight] = 25
// -----------------------------------------------------------------
console.log("\n=== TESTE 4 — Defender Cardfix por Class (subClass) ===");
{
    const player = createPlayerSnapshot();
    const mob = createMobSnapshot({
        subClass: { Knight: 25 },
    });
    const context = createAttackContext(player, mob);

    const result = combatSystem.performWeaponAttack(context);

    // Dano base: 122
    // Com subClass[Knight] = 25:
    // damage = 122 - trunc(122 * 25 / 100) = 122 - 30 = 92
    assertEqual(
        result.damage,
        92,
        "Dano com subClass -25% contra Knight",
    );

    console.log("TESTE 4 PASSOU");
}

// -----------------------------------------------------------------
// TESTE 5: ignoreDefenderCardfix = true
// -----------------------------------------------------------------
console.log("\n=== TESTE 5 — ignoreDefenderCardfix = true ===");
{
    const player = createPlayerSnapshot();
    const mob = createMobSnapshot({
        subRace: { Human: 50 }, // -50% que deve ser ignorado
    });
    const context = createAttackContext(player, mob, {
        ignoreAttackerCardfix: false,
        ignoreDefenderCardfix: true,
        ignoreElementCardfix: false,
    });

    const result = combatSystem.performWeaponAttack(context);

    // Com ignoreDefenderCardfix, o dano deve ser o original (122)
    assertEqual(
        result.damage,
        122,
        "Dano com ignoreDefenderCardfix (cardfix ignorado)",
    );

    console.log("TESTE 5 PASSOU");
}

// -----------------------------------------------------------------
// TESTE 6: Múltiplos modifiers defensivos sequenciais
// -----------------------------------------------------------------
console.log("\n=== TESTE 6 — Múltiplos modifiers defensivos sequenciais ===");
{
    const player = createPlayerSnapshot();
    const mob = createMobSnapshot({
        subRace: { Human: 20 },
        subSize: { Medium: 10 },
    });
    const context = createAttackContext(player, mob);

    const result = combatSystem.performWeaponAttack(context);

    // Aplicação sequencial com truncamento:
    // Stage 1: subRace -20%
    //   damage: 122 - trunc(122 * 20 / 100) = 122 - 24 = 98
    // Stage 2: subSize -10%
    //   damage: 98 - trunc(98 * 10 / 100) = 98 - 9 = 89
    assertEqual(
        result.damage,
        89,
        "Dano com múltiplos modifiers defensivos",
    );

    console.log("TESTE 6 PASSOU");
}

// -----------------------------------------------------------------
// TESTE 7: Defender Cardfix por Element (subElement)
// -----------------------------------------------------------------
console.log("\n=== TESTE 7 — Defender Cardfix por Element (subElement) ===");
{
    const player = createPlayerSnapshot();
    const mob = createMobSnapshot({
        subElement: { Neutral: 15 },
    });
    const context = createAttackContext(player, mob);

    const result = combatSystem.performWeaponAttack(context);

    // Dano base: 122
    // Com subElement[Neutral] = 15:
    // damage = 122 - trunc(122 * 15 / 100) = 122 - 18 = 104
    assertEqual(
        result.damage,
        104,
        "Dano com subElement -15% contra Neutral",
    );

    console.log("TESTE 7 PASSOU");
}

// -----------------------------------------------------------------
// TESTE 8: defenseAgainstAttackerClass[Knight] = 30
// -----------------------------------------------------------------
console.log("\n=== TESTE 8 — Defender Cardfix por defenseAgainstAttackerClass ===");
{
    const player = createPlayerSnapshot();
    const mob = createMobSnapshot({
        defenseAgainstAttackerClass: { Knight: 30 },
    });
    const context = createAttackContext(player, mob);

    const result = combatSystem.performWeaponAttack(context);

    // Dano base: 122
    // Com defenseAgainstAttackerClass[Knight] = 30:
    // damage = 122 - trunc(122 * 30 / 100) = 122 - 36 = 86
    assertEqual(
        result.damage,
        86,
        "Dano com defenseAgainstAttackerClass -30% contra Knight",
    );

    console.log("TESTE 8 PASSOU");
}

// -----------------------------------------------------------------
// RESULTADO
// -----------------------------------------------------------------

console.log("\n=======================================================");
console.log("DEFENDER CARDFIX INTEGRATION — TODOS OS TESTES PASSARAM");
console.log("=======================================================\n");
