import { PrismaClient } from "@prisma/client";
import { parseMobs } from "../parsers/mobParser";
const prisma = new PrismaClient();
export async function importDrops() {
    console.log("[rAthena] Reading mob_db.yml...");
    const { mobs } = parseMobs();
    console.log(`[rAthena] Mobs: ${mobs.size}`);
    /*
     * Carrega todos os itens uma única vez.
     *
     * Não devemos fazer findUnique() para cada drop.
     * São 12.823 entradas.
     */
    const items = await prisma.item.findMany({
        select: {
            id: true,
            aegisName: true,
        },
    });
    const itemsByAegisName = new Map(items.map((item) => [item.aegisName, item.id]));
    let dropsParsed = 0;
    let dropsImported = 0;
    let missingItems = 0;
    let failed = 0;
    /*
     * Processamos cada mob individualmente.
     *
     * Isso também permite reconciliar os drops daquele mob:
     * se uma entrada antiga desaparecer do rAthena,
     * ela será removida do banco.
     */
    for (const mob of mobs.values()) {
        const validSourceKeys = new Set();
        for (let index = 0; index < mob.drops.length; index++) {
            const drop = mob.drops[index];
            dropsParsed++;
            const itemId = itemsByAegisName.get(drop.item);
            if (itemId === undefined) {
                console.error(`[DropImporter] Missing item: ${drop.item} ` +
                    `(mob ${mob.id} ${mob.name})`);
                missingItems++;
                continue;
            }
            const sourceKey = `rathena:${mob.id}:${index}`;
            validSourceKeys.add(sourceKey);
            try {
                await prisma.dropEntry.upsert({
                    where: {
                        sourceKey,
                    },
                    create: {
                        mobId: mob.id,
                        itemId,
                        rate: drop.rate,
                        stealProtected: drop.stealProtected,
                        sourceKey,
                    },
                    update: {
                        mobId: mob.id,
                        itemId,
                        rate: drop.rate,
                        stealProtected: drop.stealProtected,
                    },
                });
                dropsImported++;
            }
            catch (error) {
                failed++;
                console.error(`[DropImporter] Failed: ` +
                    `mob=${mob.id} ` +
                    `item=${drop.item} ` +
                    `index=${index}`);
                console.error(error);
            }
        }
        /*
         * Remove entradas antigas desse mob que não existem
         * mais na fonte atual do rAthena.
         *
         * Isso torna o importer um sincronizador, e não apenas
         * um "insert".
         */
        if (validSourceKeys.size > 0) {
            await prisma.dropEntry.deleteMany({
                where: {
                    mobId: mob.id,
                    sourceKey: {
                        not: null,
                        notIn: Array.from(validSourceKeys),
                    },
                },
            });
        }
        else {
            /*
             * Se o mob não possui nenhum drop atualmente,
             * removemos os drops importados anteriormente.
             */
            await prisma.dropEntry.deleteMany({
                where: {
                    mobId: mob.id,
                    sourceKey: {
                        not: null,
                    },
                },
            });
        }
    }
    return {
        mobs: mobs.size,
        dropsParsed,
        dropsImported,
        missingItems,
        failed,
    };
}
async function main() {
    const start = Date.now();
    try {
        const result = await importDrops();
        const elapsed = ((Date.now() - start) / 1000).toFixed(2);
        console.log("");
        console.log("========================================");
        console.log("          DROP IMPORT COMPLETE");
        console.log("========================================");
        console.log("");
        console.log(`Mobs:             ${result.mobs}`);
        console.log(`Drops parsed:     ${result.dropsParsed}`);
        console.log(`Drops imported:   ${result.dropsImported}`);
        console.log(`Missing items:    ${result.missingItems}`);
        console.log(`Failed:           ${result.failed}`);
        console.log(`Time:             ${elapsed}s`);
        console.log("");
        if (result.missingItems > 0 || result.failed > 0) {
            console.error("[DropImporter] Import finished with errors.");
            process.exitCode = 1;
            return;
        }
        console.log("[DropImporter] Import successful.");
    }
    catch (error) {
        console.error("[DropImporter] Fatal error:");
        console.error(error);
        process.exitCode = 1;
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
