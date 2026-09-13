import { itemScriptInterpreter } from "./ItemScriptInterpreter";

// =============================================================================
// 5C.5.3.1 - ItemScriptInterpreter Cardfix - Testes Isolados
// =============================================================================
//
// Objetivo: Validar que o ItemScriptInterpreter interpreta corretamente
// os 13 opcodes de Cardfix do rAthena sem transformar valores desconhecidos.
//
// Executar: tsx src/game/items/testCardfixItemScriptInterpreter.ts
// =============================================================================

function assertEqual(actual: unknown, expected: unknown): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(
            `Expected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`
        );
    }
}

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

console.log("=".repeat(70));
console.log("5C.5.3.1 - ItemScriptInterpreter Cardfix - Testes Isolados");
console.log("=".repeat(70));
console.log();

// =========================================================================
// 5 bAdd* modifiers (Attacker Cardfix)
// =========================================================================

console.log("5 bAdd* modifiers (Attacker Cardfix)");
console.log("-".repeat(44));

runTest("bAddRace: bonus2 bAddRace,RC_Demon,5", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddRace,RC_Demon,5");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "addRace", key: "RC_Demon", value: 5 });
});

runTest("bAddRace: bonus2 bAddRace,RC_Brute,20", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddRace,RC_Brute,20");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "addRace", key: "RC_Brute", value: 20 });
});

runTest("bAddElement: bonus2 bAddElement,ELE_Fire,10", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddElement,ELE_Fire,10");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "addElement", key: "ELE_Fire", value: 10 });
});

runTest("bAddElement: bonus2 bAddElement,ELE_Neutral,15", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddElement,ELE_Neutral,15");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "addElement", key: "ELE_Neutral", value: 15 });
});

runTest("bAddSize: bonus2 bAddSize,Size_Large,15", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddSize,Size_Large,15");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "addSize", key: "Size_Large", value: 15 });
});

runTest("bAddSize: bonus2 bAddSize,Size_Medium,10", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddSize,Size_Medium,10");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "addSize", key: "Size_Medium", value: 10 });
});

runTest("bAddRace2: bonus2 bAddRace2,RC2_Demon,25", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddRace2,RC2_Demon,25");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "addRace2", key: "RC2_Demon", value: 25 });
});

runTest("bAddClass: bonus2 bAddClass,Class_Boss,30", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddClass,Class_Boss,30");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "addClass", key: "Class_Boss", value: 30 });
});

// =========================================================================
// 8 bSub*/bDefense* modifiers (Defender Cardfix)
// =========================================================================

console.log();
console.log("8 bSub*/bDefense* modifiers (Defender Cardfix)");
console.log("-".repeat(52));

runTest("bSubElement: bonus2 bSubElement,ELE_Neutral,17", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bSubElement,ELE_Neutral,17");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "subElement", key: "ELE_Neutral", value: 17 });
});

runTest("bSubDefElement: bonus2 bSubDefElement,ELE_Neutral,13", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bSubDefElement,ELE_Neutral,13");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "subDefElement", key: "ELE_Neutral", value: 13 });
});

runTest("bSubSize: bonus2 bSubSize,Size_Medium,11", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bSubSize,Size_Medium,11");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "subSize", key: "Size_Medium", value: 11 });
});

runTest("bWeaponSubSize: bonus2 bWeaponSubSize,Size_Medium,7", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bWeaponSubSize,Size_Medium,7");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "weaponSubSize", key: "Size_Medium", value: 7 });
});

runTest("bSubRace2: bonus2 bSubRace2,AttackerRace2A,10", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bSubRace2,AttackerRace2A,10");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "subRace2", key: "AttackerRace2A", value: 10 });
});

runTest("bSubRace: bonus2 bSubRace,RC_DemiHuman,5", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bSubRace,RC_DemiHuman,5");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "subRace", key: "RC_DemiHuman", value: 5 });
});

runTest("bSubClass: bonus2 bSubClass,Knight,3", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bSubClass,Knight,3");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "subClass", key: "Knight", value: 3 });
});

runTest("bDefenseAgainstAttackerClass: bonus2 bDefenseAgainstAttackerClass,Class_Knight,2", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bDefenseAgainstAttackerClass,Class_Knight,2");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "defenseAgainstAttackerClass", key: "Class_Knight", value: 2 });
});

// =========================================================================
// Combinações e casos de erro
// =========================================================================

console.log();
console.log("Combinações e casos de erro");
console.log("-".repeat(28));

runTest("Multiple Cardfix modifiers in one script", () => {
    const script = "bonus2 bAddRace,RC_Demon,5; bonus2 bAddElement,ELE_Fire,10; bonus2 bAddSize,Size_Large,15;";
    const effects = itemScriptInterpreter.interpret(script);
    assertEqual(effects.length, 3);
    assertEqual(effects[0], { type: "addRace", key: "RC_Demon", value: 5 });
    assertEqual(effects[1], { type: "addElement", key: "ELE_Fire", value: 10 });
    assertEqual(effects[2], { type: "addSize", key: "Size_Large", value: 15 });
});

runTest("Mixed Cardfix and non-Cardfix bonuses", () => {
    const script = "bonus bStr,10; bonus2 bAddRace,RC_Brute,20; bonus bAgi,5;";
    const effects = itemScriptInterpreter.interpret(script);
    assertEqual(effects.length, 3);
    assertEqual(effects[0], { type: "stat", stat: "str", value: 10 });
    assertEqual(effects[1], { type: "addRace", key: "RC_Brute", value: 20 });
    assertEqual(effects[2], { type: "stat", stat: "agi", value: 5 });
});

runTest("Missing value - should return empty array", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddRace,RC_Demon");
    assertEqual(effects.length, 0);
});

runTest("Non-numeric value - should return empty array", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddRace,RC_Demon,invalid");
    assertEqual(effects.length, 0);
});

runTest("Empty key - should return empty array", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddRace,,5");
    assertEqual(effects.length, 0);
});

runTest("Unknown opcode - should return empty array", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bUnknownOpcode,SomeKey,5");
    assertEqual(effects.length, 0);
});

runTest("Comments in script - should be ignored", () => {
    const effects = itemScriptInterpreter.interpret("// This is a comment\nbonus2 bAddRace,RC_Demon,5;");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "addRace", key: "RC_Demon", value: 5 });
});

runTest("Trailing semicolon - should be handled", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddRace,RC_Demon,5;;");
    assertEqual(effects.length, 1);
    assertEqual(effects[0], { type: "addRace", key: "RC_Demon", value: 5 });
});

// =========================================================================
// Case insensitivity
// =========================================================================

console.log();
console.log("Case insensitivity");
console.log("-".repeat(18));

runTest("Uppercase opcode - BADDRACE", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 BADDRACE,RC_Demon,5");
    assertEqual(effects[0], { type: "addRace", key: "RC_Demon", value: 5 });
});

runTest("Mixed case opcode - BaDdRaCe", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 BaDdRaCe,RC_Demon,5");
    assertEqual(effects[0], { type: "addRace", key: "RC_Demon", value: 5 });
});

runTest("bonus3 with Cardfix opcode", () => {
    const effects = itemScriptInterpreter.interpret("bonus3 bAddRace,RC_Demon,5");
    assertEqual(effects[0], { type: "addRace", key: "RC_Demon", value: 5 });
});

// =========================================================================
// Preservação de identidade rAthena
// =========================================================================

console.log();
console.log("Preservação de identidade rAthena");
console.log("-".repeat(32));

runTest("Preserve RC_ prefix", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddRace,RC_Player_Human,20");
    const addRaceEffect = effects[0] as { type: string; key: string; value: number };
    assertEqual(addRaceEffect.key, "RC_Player_Human");
});

runTest("Preserve ELE_ prefix", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddElement,ELE_Water,10");
    const addElementEffect = effects[0] as { type: string; key: string; value: number };
    assertEqual(addElementEffect.key, "ELE_Water");
});

runTest("Preserve Size_ prefix", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddSize,Size_Small,5");
    const addSizeEffect = effects[0] as { type: string; key: string; value: number };
    assertEqual(addSizeEffect.key, "Size_Small");
});

runTest("Preserve Class_ prefix", () => {
    const effects = itemScriptInterpreter.interpret("bonus2 bAddClass,Class_Normal,0");
    const addClassEffect = effects[0] as { type: string; key: string; value: number };
    assertEqual(addClassEffect.key, "Class_Normal");
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
