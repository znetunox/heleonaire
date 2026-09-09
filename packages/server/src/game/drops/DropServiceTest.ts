import { gameDataService } from "../../services/GameDataService";
import { dropService } from "./DropService";

async function testDropService(): Promise<void> {
    console.log("=".repeat(60));
    console.log("[TESTE] DropService");
    console.log("=".repeat(60));

    await gameDataService.initialize();

    const mobId = 1002;

    const mob = gameDataService.getMob(mobId);

    if (!mob) {
        throw new Error(`Mob ${mobId} não encontrado.`);
    }

    console.log(`\nMob: ${mob.name} (${mob.id})`);

    const entries = gameDataService.getMobDrops(mobId);

    console.log(`Entradas de drop: ${entries.length}`);

    if (entries.length !== 8) {
        throw new Error(
            `Poring deveria possuir 8 entradas, encontrou ${entries.length}.`
        );
    }

    console.log("\nExecutando 10 rolls:\n");

    for (let i = 1; i <= 10; i++) {
        const drops = dropService.rollDrops(mobId);

        console.log(`Roll ${i}:`);

        if (drops.length === 0) {
            console.log("  nenhum drop");
            continue;
        }

        for (const drop of drops) {
            const item = gameDataService.getItem(drop.itemId);

            console.log(
                `  ${item?.name ?? `Item ${drop.itemId}`} ` +
                `(rate=${drop.rate}, source=${drop.sourceKey})`
            );
        }
    }

    console.log("\n[TESTE ESTATÍSTICO]");

    const iterations = 100_000;

    const counters = new Map<number, number>();

    for (let i = 0; i < iterations; i++) {
        const drops = dropService.rollDrops(mobId);

        for (const drop of drops) {
            counters.set(
                drop.itemId,
                (counters.get(drop.itemId) ?? 0) + 1
            );
        }
    }

    for (const entry of entries) {
        const item = gameDataService.getItem(entry.itemId);
        const count = counters.get(entry.itemId) ?? 0;

        const expected = iterations * (entry.rate / 10000);
        const observed = (count / iterations) * 100;

        console.log(
            `${item?.name ?? entry.itemId}: ` +
            `esperado=${(entry.rate / 100).toFixed(2)}% | ` +
            `observado=${observed.toFixed(2)}%`
        );
    }

    console.log("\n" + "=".repeat(60));
    console.log("[OK] DropService funcionando.");
    console.log("=".repeat(60));
}

testDropService().catch((error) => {
    console.error("[FAIL]", error);
    process.exitCode = 1;
});