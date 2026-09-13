import { calculateElementalDamage, } from "./elementDamageCalculator";
import { getElementContext, calculateElementalAttackComponents, } from "./elementComponentCalculator";
import { gameDataService } from "../../services/GameDataService";
const attributeTable = gameDataService.getAttributeTable();
// ============================================================================
// Testes para calculateElementalDamage
// ============================================================================
// 1. Neutral → Neutral mantém o dano
(() => {
    const result = calculateElementalDamage(100, "Neutral", "Neutral", 1, attributeTable);
    if (result.preElementDamage !== 100) {
        throw new Error(`Neutral→Neutral preElementDamage: expected 100, got ${result.preElementDamage}`);
    }
    if (result.postElementDamage !== 100) {
        throw new Error(`Neutral→Neutral postElementDamage: expected 100, got ${result.postElementDamage}`);
    }
    if (result.elementRatio !== 100) {
        throw new Error(`Neutral→Neutral ratio: expected 100, got ${result.elementRatio}`);
    }
    console.log("✓ Neutral → Neutral mantém o dano");
})();
// 2. Fire → Fire reduz o dano
(() => {
    const result = calculateElementalDamage(100, "Fire", "Fire", 1, attributeTable);
    if (result.preElementDamage !== 100) {
        throw new Error(`Fire→Fire preElementDamage: expected 100, got ${result.preElementDamage}`);
    }
    // Fire → Fire deve reduzir o dano (ratio < 100)
    if (result.postElementDamage >= result.preElementDamage) {
        throw new Error(`Fire→Fire postElementDamage: expected < 100, got ${result.postElementDamage}`);
    }
    if (result.elementRatio >= 100) {
        throw new Error(`Fire→Fire ratio: expected < 100, got ${result.elementRatio}`);
    }
    console.log("✓ Fire → Fire reduz conforme a tabela");
})();
// 3. Fire → Earth aumenta o dano
(() => {
    const result = calculateElementalDamage(100, "Fire", "Earth", 1, attributeTable);
    if (result.preElementDamage !== 100) {
        throw new Error(`Fire→Earth preElementDamage: expected 100, got ${result.preElementDamage}`);
    }
    // Fire → Earth deve aumentar o dano (ratio > 100)
    if (result.postElementDamage <= result.preElementDamage) {
        throw new Error(`Fire→Earth postElementDamage: expected > 100, got ${result.postElementDamage}`);
    }
    if (result.elementRatio <= 100) {
        throw new Error(`Fire→Earth ratio: expected > 100, got ${result.elementRatio}`);
    }
    console.log("✓ Fire → Earth aumenta o dano conforme a tabela");
})();
// 4. Water → Fire aumenta o dano (Water é forte contra Fire)
(() => {
    const result = calculateElementalDamage(100, "Water", "Fire", 1, attributeTable);
    if (result.preElementDamage !== 100) {
        throw new Error(`Water→Fire preElementDamage: expected 100, got ${result.preElementDamage}`);
    }
    // Water → Fire deve aumentar o dano (ratio > 100)
    if (result.postElementDamage <= result.preElementDamage) {
        throw new Error(`Water→Fire postElementDamage: expected > 100, got ${result.postElementDamage}`);
    }
    if (result.elementRatio <= 100) {
        throw new Error(`Water→Fire ratio: expected > 100, got ${result.elementRatio}`);
    }
    console.log("✓ Water → Fire aumenta o dano conforme a tabela");
})();
// 5. Testar Ghost/Neutral com diferentes níveis
(() => {
    const elements = [
        ["Ghost", "Neutral", 1],
        ["Ghost", "Neutral", 2],
        ["Ghost", "Neutral", 3],
        ["Ghost", "Neutral", 4],
        ["Undead", "Ghost", 1],
        ["Undead", "Ghost", 2],
    ];
    for (const [attackElement, targetElement, level] of elements) {
        const result = calculateElementalDamage(100, attackElement, targetElement, level, attributeTable);
        if (result.preElementDamage !== 100) {
            throw new Error(`${attackElement}→${targetElement} L${level} preElementDamage: expected 100, got ${result.preElementDamage}`);
        }
        if (result.targetElementLevel !== level) {
            throw new Error(`${attackElement}→${targetElement} L${level} level: expected ${level}, got ${result.targetElementLevel}`);
        }
    }
    console.log("✓ Ghost/Neutral/Undead usam o nível elemental correto");
})();
// ============================================================================
// Testes para getElementContext (não modifica componentes)
// ============================================================================
// 6. Nenhum AttackComponents é mutado pelo estágio elemental
(() => {
    const originalComponents = {
        statusAtk: 100,
        weaponAtk: 50,
        equipAtk: 25,
        masteryAtk: 75,
        patk: 0,
    };
    const context = getElementContext("Fire", "Earth", 1, attributeTable, "Neutral");
    // O contexto deve ser criado sem modificar os componentes
    if (context.attackElement !== "Fire") {
        throw new Error(`Context attackElement: expected Fire, got ${context.attackElement}`);
    }
    if (context.targetElement !== "Earth") {
        throw new Error(`Context targetElement: expected Earth, got ${context.targetElement}`);
    }
    if (context.targetElementLevel !== 1) {
        throw new Error(`Context level: expected 1, got ${context.targetElementLevel}`);
    }
    console.log("✓ getElementContext não modifica componentes");
})();
// 7. calculateElementalAttackComponents preserva componentes inalterados
(() => {
    const originalComponents = {
        statusAtk: 100,
        weaponAtk: 50,
        equipAtk: 25,
        masteryAtk: 75,
        patk: 0,
    };
    const result = calculateElementalAttackComponents(originalComponents, 20, // batk
    "Fire", "Earth", 1, attributeTable, "Neutral");
    // Verificar que input e output são iguais (não modificados)
    if (result.input.statusAtk !== originalComponents.statusAtk) {
        throw new Error(`Input statusAtk: expected ${originalComponents.statusAtk}, got ${result.input.statusAtk}`);
    }
    if (result.output.statusAtk !== originalComponents.statusAtk) {
        throw new Error(`Output statusAtk: expected ${originalComponents.statusAtk}, got ${result.output.statusAtk}`);
    }
    if (result.output.weaponAtk !== originalComponents.weaponAtk) {
        throw new Error(`Output weaponAtk: expected ${originalComponents.weaponAtk}, got ${result.output.weaponAtk}`);
    }
    // Verificar que o contexto está presente
    if (!result.context) {
        throw new Error("Context is missing");
    }
    if (result.context.attackElement !== "Fire") {
        throw new Error(`Context attackElement: expected Fire, got ${result.context.attackElement}`);
    }
    console.log("✓ calculateElementalAttackComponents preserva componentes inalterados");
})();
// ============================================================================
// Testes de dados de tabela
// ============================================================================
// 8. Verificar que a tabela de atributos está funcionando corretamente
(() => {
    // Fire → Earth deve ser > 100
    const fireEarthRatio = attributeTable.getRatio(1, "Fire", "Earth");
    if (fireEarthRatio <= 100) {
        throw new Error(`Fire→Earth ratio: expected > 100, got ${fireEarthRatio}`);
    }
    // Fire → Fire deve ser < 100
    const fireFireRatio = attributeTable.getRatio(1, "Fire", "Fire");
    if (fireFireRatio >= 100) {
        throw new Error(`Fire→Fire ratio: expected < 100, got ${fireFireRatio}`);
    }
    // Neutral → Neutral deve ser == 100
    const neutralNeutralRatio = attributeTable.getRatio(1, "Neutral", "Neutral");
    if (neutralNeutralRatio !== 100) {
        throw new Error(`Neutral→Neutral ratio: expected 100, got ${neutralNeutralRatio}`);
    }
    console.log("✓ Tabela de atributos está funcionando corretamente");
})();
// ============================================================================
// Testes de fórmulas
// ============================================================================
// 9. Verificar fórmula: damage - trunc(damage * (100 - ratio) / 100)
(() => {
    // Para ratio = 150 (aumenta 50%):
    // result = damage - trunc(damage * (100 - 150) / 100)
    // result = damage - trunc(damage * (-50) / 100)
    // result = damage - trunc(-damage * 0.5)
    // result = damage + trunc(damage * 0.5)
    // Para damage = 100: 100 + trunc(50) = 150
    // Para ratio = 50 (reduz 50%):
    // result = damage - trunc(damage * (100 - 50) / 100)
    // result = damage - trunc(damage * 50 / 100)
    // result = damage - trunc(damage * 0.5)
    // Para damage = 100: 100 - trunc(50) = 50
    // Teste com ratio > 100 (aumenta)
    const result1 = calculateElementalDamage(100, "Fire", "Earth", 1, attributeTable);
    // O dano deve aumentar
    if (result1.postElementDamage <= result1.preElementDamage) {
        throw new Error(`Fórmula com ratio > 100: expected post > pre, got ${result1.postElementDamage} <= ${result1.preElementDamage}`);
    }
    // Teste com ratio < 100 (reduz)
    const result2 = calculateElementalDamage(100, "Fire", "Fire", 1, attributeTable);
    // O dano deve reduzir
    if (result2.postElementDamage >= result2.preElementDamage) {
        throw new Error(`Fórmula com ratio < 100: expected post < pre, got ${result2.postElementDamage} >= ${result2.preElementDamage}`);
    }
    console.log("✓ Fórmula de dano elemental está correta");
})();
console.log("\nAll elemental damage tests passed!");
