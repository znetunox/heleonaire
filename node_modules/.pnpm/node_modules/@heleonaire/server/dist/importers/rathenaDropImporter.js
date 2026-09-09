import { rathenaDb } from "../parsers/rathenaParser";
import { prisma } from "../db/prisma";
export async function importRathenaDrops() {
    let imported = 0;
    let ignored = 0;
    for (const mob of rathenaDb.getAllMobs()) {
        for (const drop of mob.drops) {
            // Valida que o Item existe no banco antes de criar o DropEntry
            const item = await prisma.item.findUnique({
                where: { aegisName: drop.item },
            });
            if (!item) {
                // Item não existe — ignora este Drop
                ignored++;
                continue;
            }
            // Cria/atualiza o DropEntry usando upsert (respeita @@unique)
            await prisma.dropEntry.upsert({
                where: {
                    mobId_itemId: {
                        mobId: mob.id,
                        itemId: item.id,
                    },
                },
                create: {
                    mobId: mob.id,
                    itemId: item.id,
                    rate: drop.rate,
                    stealProtected: drop.stealProtected ?? false,
                },
                update: {
                    rate: drop.rate,
                    stealProtected: drop.stealProtected ?? false,
                },
            });
            imported++;
        }
    }
    return { imported, ignored };
}
