import { rathenaDb } from "../parsers/rathenaParser";
import { prisma } from "../db/prisma";
/**
 * Script de diagnóstico para auditar os drops do rAthena.
 *
 * Objetivo:
 * 1. Carregar `rathenaDb`.
 * 2. Percorrer todos os Mobs e seus `drops`.
 * 3. Contar:
 *    - total de entradas de Drop lidas do rAthena;
 *    - total de pares únicos `(mobId, itemId)`;
 *    - quantidade de duplicatas desses pares.
 * 4. Comparar com os DropEntries existentes no banco.
 * 5. Não altera o banco nem o schema.
 */
async function auditRathenaDrops() {
    console.log("=".repeat(60));
    console.log("[DIAGNÓSTICO] Auditando Drops do rAthena");
    console.log("=".repeat(60));
    // 1. Carregar o banco rAthena (se ainda não carregado)
    if (!rathenaDb.loaded) {
        console.log("[rAthena] Carregando banco de dados...");
        await rathenaDb.load();
    }
    // 2. Contadores
    let totalDrops = 0;
    const dropPairs = new Map(); // "mobId|itemId" -> count
    // 3. Percorrer todos os Mobs e seus drops
    console.log("\n[rAthena] Iterando sobre todos os mobs e seus drops...");
    for (const mob of rathenaDb.getAllMobs()) {
        for (const drop of mob.drops) {
            totalDrops++;
            const key = `${mob.id}|${drop.item}`;
            dropPairs.set(key, (dropPairs.get(key) ?? 0) + 1);
        }
    }
    // 4. Calcular duplicatas
    const uniquePairs = dropPairs.size;
    const duplicateCount = totalDrops - uniquePairs;
    // 5. Mostrar resultados no console
    console.log("\n" + "-".repeat(60));
    console.log("[RESULTADOS]");
    console.log("-".repeat(60));
    console.log(`Drops totais no rAthena: ${totalDrops}`);
    console.log(`Pares únicos (mobId + item): ${uniquePairs}`);
    console.log(`Duplicatas: ${duplicateCount}`);
    // 6. Consultar DropEntries existentes no banco (apenas count)
    const existingDropEntriesCount = await prisma.dropEntry.count();
    console.log(`DropEntries no banco: ${existingDropEntriesCount}`);
    // 7. Comparar
    console.log("\n" + "-".repeat(60));
    console.log("[COMPARAÇÃO]");
    console.log("-".repeat(60));
    const diffFromUnique = uniquePairs - existingDropEntriesCount;
    const diffFromTotal = totalDrops - existingDropEntriesCount;
    console.log(`Diferença (pares únicos vs banco): ${diffFromUnique}`);
    console.log(`Diferença (drops totais vs banco): ${diffFromTotal}`);
    // 8. Mostrar duplicatas por par (se houver)
    const duplicates = Array.from(dropPairs.entries())
        .filter(([_, count]) => count > 1)
        .map(([key, count]) => {
        const [mobId, itemAegisName] = key.split("|");
        return {
            mobId: Number(mobId),
            itemAegisName,
            count,
        };
    });
    if (duplicates.length > 0) {
        console.log("\n[rAthena] Duplicatas encontradas (primeiras 10):");
        console.log("-".repeat(60));
        for (const dup of duplicates.slice(0, 10)) {
            console.log(`  Mob ${dup.mobId} + Item ${dup.itemAegisName}: ${dup.count} ocorrências`);
        }
        if (duplicates.length > 10) {
            console.log(`  ... e mais ${duplicates.length - 10} duplicatas`);
        }
    }
    else {
        console.log("\n[rAthena] Sem duplicatas encontradas.");
    }
    // 9. Resumo final
    console.log("\n" + "=".repeat(60));
    console.log("[RESUMO]");
    console.log("=".repeat(60));
    console.log(`Total Drops (rAthena): ${totalDrops}`);
    console.log(`Pares Únicos: ${uniquePairs}`);
    console.log(`DropEntries (banco): ${existingDropEntriesCount}`);
    console.log(`Diferença: ${diffFromUnique}`);
    console.log("=".repeat(60));
}
// Executa o script
auditRathenaDrops().catch(console.error);
