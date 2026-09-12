import { resolveEffectiveAttackElement, } from "./effectiveAttackElementResolver";
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: esperado ${expected}, recebido ${actual}`);
    }
}
console.log("\n=== TESTE 42 — sem status preserva elemento-base ===");
{
    const result = resolveEffectiveAttackElement("Neutral", {});
    assertEqual(result, "Neutral", "elemento-base");
}
console.log("TESTE 42 PASSOU");
console.log("\n=== TESTE 43 — Fire Weapon → Fire ===");
{
    const result = resolveEffectiveAttackElement("Neutral", {
        fireWeapon: true,
    });
    assertEqual(result, "Fire", "Fire Weapon");
}
console.log("TESTE 43 PASSOU");
console.log("\n=== TESTE 44 — Fire Weapon + Aspersio → Fire ===");
{
    const result = resolveEffectiveAttackElement("Neutral", {
        fireWeapon: true,
        aspersio: true,
    });
    assertEqual(result, "Fire", "prioridade Fire > Holy");
}
console.log("TESTE 44 PASSOU");
console.log("\n=== TESTE 45 — EnchantArms + Fire → EnchantArms ===");
{
    const result = resolveEffectiveAttackElement("Neutral", {
        enchantArms: "Ghost",
        fireWeapon: true,
        aspersio: true,
    });
    assertEqual(result, "Ghost", "prioridade EnchantArms");
}
console.log("TESTE 45 PASSOU");
console.log("\n=== TESTE 46 — Ghost + Tidal → Ghost ===");
{
    const result = resolveEffectiveAttackElement("Neutral", {
        ghostWeapon: true,
        tidalWeapon: true,
    });
    assertEqual(result, "Ghost", "prioridade Ghost > Tidal");
}
console.log("TESTE 46 PASSOU");
console.log("\n==========================================");
console.log("EFFECTIVE ATTACK ELEMENT — TODOS OS TESTES PASSARAM");
console.log("==========================================");
