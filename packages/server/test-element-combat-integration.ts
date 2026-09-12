import { combatSystem } from "./src/game/combat/CombatSystem";
import { resolveBasicAttackComponents } from "./src/game/combat/basicAttackResolver";
import { resolveEffectiveAttackElement } from "./src/game/combat/effectiveAttackElementResolver";
import { gameDataService } from "./src/services/GameDataService";
import type {
    PlayerCombatSnapshot,
    MobCombatSnapshot,
} from "./src/game/combat/combatTypes";

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

const table = gameDataService.getAttributeTable();

const attacker: PlayerCombatSnapshot = {
    characterId: "char-1",
    name: "Hero",
    jobKey: "KNIGHT",
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
    },
    equipAtk: 7,
    ammoAtk: 0,
    atkRate: 0,
    weaponAtkRate: 0,
    weaponDamageRateByType: {},
    weaponAtkByType: {},
    weapon: {
        itemId: 1,
        aegisName: "FIRE_SWORD",
        name: "Fire Sword",
        slot: "Both_Hand",
        inventoryId: null,
        attack: 100,
        weaponAtkBonus: 0,
        weaponAtk2Bonus: 0,
        weaponLevel: 1,
        weaponType: "Sword",
        range: 1,
        refineLevel: 0,
        refineBonus: 10,
        overRefineBonus: 0,
        element: "Fire",
    },
    ammo: null,
};

const components = resolveBasicAttackComponents(attacker, {
    targetSize: "Medium",
    randomValue: 0.5,
    overRefineRandomValue: 0.5,
});

console.log("\n=== BASE COMPONENTS ===");
console.table(components);
assertEqual(components.statusAtk, 122, "Base statusAtk");
assertEqual(components.weaponAtk, 135, "Base weaponAtk");
assertEqual(components.equipAtk, 7, "Base equipAtk");

// -----------------------------------------------------------------
// TESTE 1: Fire Weapon contra Fire Lv1 (Mob com 0 DEF para isolar)
// -----------------------------------------------------------------
console.log("\n=== TESTE 1 — Fire Weapon vs Fire Lv1 ===");
{
    const target: MobCombatSnapshot = {
        mobDbId: 1001,
        aegisName: "FIRE_MOB",
        name: "Fire Mob",
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
        size: "Medium",
        race: "Formless",
        element: "Fire",
        elementLevel: 1,
    };

    const effectiveElement = resolveEffectiveAttackElement(
        attacker.weapon?.element ?? "Neutral",
        {},
    );
    assertEqual(effectiveElement, "Fire", "Effective element");

    const result = combatSystem.performWeaponAttack({
        attacker,
        target,
        components,
        attackElement: effectiveElement,
        targetElement: "Fire",
        targetElementLevel: 1,
        skillRatio: 100,
        skillConstant: 0,
        skillId: 0,
        isCritical: false,
        usesAmmo: false,
    });

    console.table({
        attackElement: effectiveElement,
        targetElement: "Fire",
        preDefenseDamage: result.preDefenseDamage,
        finalDamage: result.damage,
        elementalStatusAtk: result.elementalComponents?.statusAtk,
        elementalWeaponAtk: result.elementalComponents?.weaponAtk,
        elementalEquipAtk: result.elementalComponents?.equipAtk,
    });

    // Neutral -> Fire L1 = 100% -> 61 * 100% * 2 = 122
    // Fire -> Fire L1 = 25% -> 135 * 25% = 34
    // Fire -> Fire L1 = 25% -> 7 * 25% = 2
    // Total = 122 + 34 + 2 = 158
    assertEqual(result.elementalComponents?.statusAtk ?? 0, 122, "Elemental statusAtk");
    assertEqual(result.elementalComponents?.weaponAtk ?? 0, 34, "Elemental weaponAtk");
    assertEqual(result.elementalComponents?.equipAtk ?? 0, 2, "Elemental equipAtk");
    assertEqual(result.damage, 158, "Final damage");
}
console.log("TESTE 1 PASSOU");

// -----------------------------------------------------------------
// TESTE 2: Fire Weapon contra Earth Lv1 (150% fraqueza)
// -----------------------------------------------------------------
console.log("\n=== TESTE 2 — Fire Weapon vs Earth Lv1 ===");
{
    const target: MobCombatSnapshot = {
        mobDbId: 1002,
        aegisName: "EARTH_MOB",
        name: "Earth Mob",
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
        size: "Medium",
        race: "Formless",
        element: "Earth",
        elementLevel: 1,
    };

    const result = combatSystem.performWeaponAttack({
        attacker,
        target,
        components,
        attackElement: "Fire",
        targetElement: "Earth",
        targetElementLevel: 1,
        skillRatio: 100,
        skillConstant: 0,
        skillId: 0,
        isCritical: false,
        usesAmmo: false,
    });

    // Neutral -> Earth L1 = 100% -> 61 * 2 = 122
    // Fire -> Earth L1 = 150% -> 135 * 1.5 = 202
    // Fire -> Earth L1 = 150% -> 7 * 1.5 = 10
    // Total = 122 + 202 + 10 = 334
    assertEqual(result.elementalComponents?.statusAtk ?? 0, 122, "Elemental statusAtk");
    assertEqual(result.elementalComponents?.weaponAtk ?? 0, 202, "Elemental weaponAtk");
    assertEqual(result.elementalComponents?.equipAtk ?? 0, 10, "Elemental equipAtk");
    assertEqual(result.damage, 334, "Final damage");
}
console.log("TESTE 2 PASSOU");

// -----------------------------------------------------------------
// TESTE 3: Neutral Weapon contra Ghost Lv1 (Neutral sofre penalidade)
// -----------------------------------------------------------------
console.log("\n=== TESTE 3 — Neutral Weapon vs Ghost Lv1 ===");
{
    const target: MobCombatSnapshot = {
        mobDbId: 1003,
        aegisName: "GHOST_MOB",
        name: "Ghost Mob",
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
        size: "Medium",
        race: "Formless",
        element: "Ghost",
        elementLevel: 1,
    };

    // Neutral -> Ghost L1 = 90% in Renewal (L1=90, L2=70, L3=50, L4=0)
    // batk = 61 - trunc(61 * 10 / 100) = 61 - 6 = 55
    // statusAtk = 55 * 2 = 110
    // weaponAtk (Neutral) = 135 - trunc(135 * 10 / 100) = 135 - 13 = 122
    // equipAtk (Neutral) = 7 - trunc(7 * 10 / 100) = 7 - 0 = 7
    // total = 110 + 122 + 7 = 239
    const result = combatSystem.performWeaponAttack({
        attacker,
        target,
        components,
        attackElement: "Neutral",
        targetElement: "Ghost",
        targetElementLevel: 1,
        skillRatio: 100,
        skillConstant: 0,
        skillId: 0,
        isCritical: false,
        usesAmmo: false,
    });

    assertEqual(result.elementalComponents?.statusAtk ?? 0, 110, "Elemental statusAtk Ghost L1");
    assertEqual(result.elementalComponents?.weaponAtk ?? 0, 122, "Elemental weaponAtk Ghost L1");
    assertEqual(result.elementalComponents?.equipAtk ?? 0, 7, "Elemental equipAtk Ghost L1");
    assertEqual(result.damage, 239, "Final damage Ghost L1");
}
console.log("TESTE 3 PASSOU");

// -----------------------------------------------------------------
// TESTE 4: Buff de elemento sobrepõe elemento da arma
// -----------------------------------------------------------------
console.log("\n=== TESTE 4 — EnchantArms Water sobrepõe Fire Weapon ===");
{
    const effectiveElement = resolveEffectiveAttackElement(
        attacker.weapon?.element ?? "Neutral",
        {
            enchantArms: "Water",
            fireWeapon: true,
        },
    );
    assertEqual(effectiveElement, "Water", "Water override");

    const target: MobCombatSnapshot = {
        mobDbId: 1004,
        aegisName: "FIRE_MOB_2",
        name: "Fire Mob 2",
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
        size: "Medium",
        race: "Formless",
        element: "Fire",
        elementLevel: 1,
    };

    const result = combatSystem.performWeaponAttack({
        attacker,
        target,
        components,
        attackElement: effectiveElement,
        targetElement: "Fire",
        targetElementLevel: 1,
        skillRatio: 100,
        skillConstant: 0,
        skillId: 0,
        isCritical: false,
        usesAmmo: false,
    });

    // Water -> Fire L1 = 150%
    // statusAtk = 122 (Neutral -> Fire = 100%)
    // weaponAtk = 135 * 1.5 = 202
    // equipAtk = 7 * 1.5 = 10
    // total = 334
    assertEqual(result.elementalComponents?.weaponAtk ?? 0, 202, "Water vs Fire weaponAtk");
    assertEqual(result.damage, 334, "Water vs Fire damage");
}
console.log("TESTE 4 PASSOU");

console.log("\n=======================================================");
console.log("COMBAT SYSTEM ELEMENT INTEGRATION — TODOS OS TESTES PASSARAM");
console.log("=======================================================\n");
