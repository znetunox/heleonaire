import { gameDataService } from "../../services/GameDataService";
async function testGameDataService() {
    console.log("=".repeat(60));
    console.log("[TESTE] GameDataService");
    console.log("=".repeat(60));
    await gameDataService.initialize();
    console.log("\n[CONTAGEM]");
    console.log(`Mobs:  ${gameDataService.getMobCount()}`);
    console.log(`Items: ${gameDataService.getItemCount()}`);
    console.log(`Drops: ${gameDataService.getDropCount()}`);
    // ============================================================
    // PORING
    // ============================================================
    const poring = gameDataService.getMob(1002);
    if (!poring) {
        throw new Error("Poring (1002) não encontrado.");
    }
    console.log("\n[MOB 1002]");
    console.log(`Nome: ${poring.name}`);
    console.log(`Aegis: ${poring.aegisName}`);
    console.log(`Level: ${poring.level}`);
    console.log(`HP: ${poring.hp}`);
    console.log(`ATK: ${poring.attack}`);
    const drops = gameDataService.getMobDrops(1002);
    console.log(`\nDrops do Poring: ${drops.length}`);
    for (const drop of drops) {
        const item = gameDataService.getItem(drop.itemId);
        if (!item) {
            throw new Error(`Item ${drop.itemId} do drop ${drop.sourceKey} não encontrado.`);
        }
        console.log(`  ${drop.sourceKey} | ` +
            `${item.id} ${item.name} | ` +
            `rate=${drop.rate} | ` +
            `stealProtected=${drop.stealProtected}`);
    }
    // ============================================================
    // VALIDAÇÕES
    // ============================================================
    if (drops.length !== 8) {
        throw new Error(`Poring deveria possuir 8 drops, mas possui ${drops.length}.`);
    }
    const appleDrops = drops.filter((drop) => drop.itemId === 512);
    if (appleDrops.length !== 2) {
        throw new Error(`Poring deveria possuir 2 entradas de Apple, mas possui ${appleDrops.length}.`);
    }
    const appleRates = appleDrops
        .map((drop) => drop.rate)
        .sort((a, b) => a - b);
    if (appleRates.length !== 2 ||
        appleRates[0] !== 150 ||
        appleRates[1] !== 1000) {
        throw new Error(`Rates de Apple incorretos: ${appleRates.join(", ")}`);
    }
    const cardDrop = drops.find((drop) => drop.itemId === 4001);
    if (!cardDrop) {
        throw new Error("Poring Card não encontrada.");
    }
    if (!cardDrop.stealProtected) {
        throw new Error("Poring Card deveria possuir stealProtected=true.");
    }
    console.log("\n" + "=".repeat(60));
    console.log("[OK] GameDataService validado.");
    console.log("=".repeat(60));
}
testGameDataService().catch((error) => {
    console.error("\n[FAIL]", error);
    process.exitCode = 1;
});
