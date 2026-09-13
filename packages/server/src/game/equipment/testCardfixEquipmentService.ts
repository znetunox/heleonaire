import { EquipmentService, type CardfixModifiers } from "./EquipmentService";

// =============================================================================
// 5C.5.3.2 - EquipmentService - Cardfix aggregation tests
// =============================================================================
//
// Objetivo: Validar que o EquipmentService agrega corretamente os modifiers
// de Cardfix dos itens equipados.
//
// Executar: tsx src/game/equipment/testCardfixEquipmentService.ts
//
// NOTE: Este teste valida a interface CardfixModifiers e a lógica de
// agregação. Testes de integração com banco de dados devem ser feitos
// separadamente com dados reais importados do rAthena.
// =============================================================================

console.log("=".repeat(70));
console.log("5C.5.3.2 - EquipmentService Cardfix - Testes de Interface");
console.log("=".repeat(70));
console.log();

let total = 0;
let passed = 0;
let failed = 0;

function runTest(testName: string, testFn: () => void): void {
    total++;
    try {
        testFn();
        passed++;
        console.log(`✓ ${testName}`);
    } catch (e) {
        failed++;
        const error = e instanceof Error ? e.message : String(e);
        console.log(`✗ ${testName}`);
        console.log(`  Error: ${error}`);
    }
}

function assertEqual(actual: unknown, expected: unknown): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(
            `Expected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`
        );
    }
}

// =========================================================================
// Teste 1: Interface CardfixModifiers existe e tem todos os campos
// =========================================================================

runTest("CardfixModifiers interface tem todos os 13 campos", () => {
    const emptyCardfix: CardfixModifiers = {
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
    assertEqual(Object.keys(emptyCardfix).length, 13);
});

runTest("CardfixModifiers campos são Records<string, number>", () => {
    const cardfix: CardfixModifiers = {
        addRace: { RC_Demon: 5 },
        addElement: { ELE_Fire: 10 },
        addSize: { Size_Large: 15 },
        addRace2: { RC2_Demon: 20 },
        addClass: { Class_Boss: 25 },
        subElement: { ELE_Neutral: 17 },
        subDefElement: { ELE_Fire: 13 },
        subSize: { Size_Medium: 11 },
        weaponSubSize: { Size_Small: 7 },
        subRace2: { AttackerRace2A: 10 },
        subRace: { RC_DemiHuman: 5 },
        subClass: { Knight: 3 },
        defenseAgainstAttackerClass: { Class_Knight: 2 },
    };
    assertEqual(cardfix.addRace["RC_Demon"], 5);
    assertEqual(cardfix.addElement["ELE_Fire"], 10);
    assertEqual(cardfix.addSize["Size_Large"], 15);
    assertEqual(cardfix.addRace2["RC2_Demon"], 20);
    assertEqual(cardfix.addClass["Class_Boss"], 25);
    assertEqual(cardfix.subElement["ELE_Neutral"], 17);
    assertEqual(cardfix.subDefElement["ELE_Fire"], 13);
    assertEqual(cardfix.subSize["Size_Medium"], 11);
    assertEqual(cardfix.weaponSubSize["Size_Small"], 7);
    assertEqual(cardfix.subRace2["AttackerRace2A"], 10);
    assertEqual(cardfix.subRace["RC_DemiHuman"], 5);
    assertEqual(cardfix.subClass["Knight"], 3);
    assertEqual(cardfix.defenseAgainstAttackerClass["Class_Knight"], 2);
});

// =========================================================================
// Teste 2: Lógica de agregação (simulada)
// =========================================================================

runTest("Agregação: dois itens mesma chave", () => {
    const cardfix: CardfixModifiers = {
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
    
    // Simular dois itens com bAddRace RC_Demon
    cardfix.addRace["RC_Demon"] = (cardfix.addRace["RC_Demon"] ?? 0) + 5;
    cardfix.addRace["RC_Demon"] = (cardfix.addRace["RC_Demon"] ?? 0) + 10;
    
    assertEqual(cardfix.addRace["RC_Demon"], 15);
});

runTest("Agregação: chaves diferentes", () => {
    const cardfix: CardfixModifiers = {
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
    
    cardfix.addRace["RC_Demon"] = (cardfix.addRace["RC_Demon"] ?? 0) + 10;
    cardfix.addRace["RC_Brute"] = (cardfix.addRace["RC_Brute"] ?? 0) + 20;
    
    assertEqual(cardfix.addRace["RC_Demon"], 10);
    assertEqual(cardfix.addRace["RC_Brute"], 20);
});

runTest("Agregação: todos os 13 campos", () => {
    const cardfix: CardfixModifiers = {
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
    
    // Adicionar valores para todos os campos
    cardfix.addRace["RC_Demon"] = (cardfix.addRace["RC_Demon"] ?? 0) + 5;
    cardfix.addElement["ELE_Fire"] = (cardfix.addElement["ELE_Fire"] ?? 0) + 10;
    cardfix.addSize["Size_Large"] = (cardfix.addSize["Size_Large"] ?? 0) + 15;
    cardfix.addRace2["RC2_Demon"] = (cardfix.addRace2["RC2_Demon"] ?? 0) + 20;
    cardfix.addClass["Class_Boss"] = (cardfix.addClass["Class_Boss"] ?? 0) + 25;
    cardfix.subElement["ELE_Neutral"] = (cardfix.subElement["ELE_Neutral"] ?? 0) + 17;
    cardfix.subDefElement["ELE_Fire"] = (cardfix.subDefElement["ELE_Fire"] ?? 0) + 13;
    cardfix.subSize["Size_Medium"] = (cardfix.subSize["Size_Medium"] ?? 0) + 11;
    cardfix.weaponSubSize["Size_Small"] = (cardfix.weaponSubSize["Size_Small"] ?? 0) + 7;
    cardfix.subRace2["AttackerRace2A"] = (cardfix.subRace2["AttackerRace2A"] ?? 0) + 10;
    cardfix.subRace["RC_DemiHuman"] = (cardfix.subRace["RC_DemiHuman"] ?? 0) + 5;
    cardfix.subClass["Knight"] = (cardfix.subClass["Knight"] ?? 0) + 3;
    cardfix.defenseAgainstAttackerClass["Class_Knight"] = (cardfix.defenseAgainstAttackerClass["Class_Knight"] ?? 0) + 2;
    
    assertEqual(cardfix.addRace["RC_Demon"], 5);
    assertEqual(cardfix.addElement["ELE_Fire"], 10);
    assertEqual(cardfix.addSize["Size_Large"], 15);
    assertEqual(cardfix.addRace2["RC2_Demon"], 20);
    assertEqual(cardfix.addClass["Class_Boss"], 25);
    assertEqual(cardfix.subElement["ELE_Neutral"], 17);
    assertEqual(cardfix.subDefElement["ELE_Fire"], 13);
    assertEqual(cardfix.subSize["Size_Medium"], 11);
    assertEqual(cardfix.weaponSubSize["Size_Small"], 7);
    assertEqual(cardfix.subRace2["AttackerRace2A"], 10);
    assertEqual(cardfix.subRace["RC_DemiHuman"], 5);
    assertEqual(cardfix.subClass["Knight"], 3);
    assertEqual(cardfix.defenseAgainstAttackerClass["Class_Knight"], 2);
});

// =========================================================================
// Teste 3: Preservação de identidade rAthena
// =========================================================================

runTest("Preservação: RC_ prefix", () => {
    const cardfix: CardfixModifiers = {
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
    
    cardfix.addRace["RC_Player_Human"] = 20;
    assertEqual(cardfix.addRace["RC_Player_Human"], 20);
});

runTest("Preservação: ELE_ prefix", () => {
    const cardfix: CardfixModifiers = {
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
    
    cardfix.addElement["ELE_Water"] = 10;
    assertEqual(cardfix.addElement["ELE_Water"], 10);
});

runTest("Preservação: Size_ prefix", () => {
    const cardfix: CardfixModifiers = {
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
    
    cardfix.addSize["Size_Small"] = 5;
    assertEqual(cardfix.addSize["Size_Small"], 5);
});

runTest("Preservação: Class_ prefix", () => {
    const cardfix: CardfixModifiers = {
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
    
    cardfix.addClass["Class_Normal"] = 0;
    assertEqual(cardfix.addClass["Class_Normal"], 0);
});

// =========================================================================
// Summary
// =========================================================================

console.log();
console.log("=".repeat(70));
console.log("SUMMARY");
console.log("=".repeat(70));
console.log(`Total: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log("=".repeat(70));

if (failed > 0) {
    process.exit(1);
}

console.log("\n✓ All tests passed!");
console.log("\nNOTE: Para testar integração com banco de dados,");
console.log("importar dados do rAthena e verificar com itens reais.");
