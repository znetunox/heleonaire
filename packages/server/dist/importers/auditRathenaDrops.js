import { prisma } from "../db/prisma";
async function auditDatabaseDrops() {
    console.log("=".repeat(60));
    console.log("[AUDITORIA] Integridade dos Drops no banco");
    console.log("=".repeat(60));
    try {
        const [mobCount, itemCount, dropCount, dropsWithoutSourceKey, mobsWithDrops, mobsWithoutDrops,] = await Promise.all([
            prisma.mob.count(),
            prisma.item.count(),
            prisma.dropEntry.count(),
            prisma.dropEntry.count({
                where: {
                    sourceKey: null,
                },
            }),
            prisma.mob.count({
                where: {
                    drops: {
                        some: {},
                    },
                },
            }),
            prisma.mob.count({
                where: {
                    drops: {
                        none: {},
                    },
                },
            }),
        ]);
        console.log("\n[CONTAGEM]");
        console.log("-".repeat(60));
        console.log(`Mobs:                 ${mobCount}`);
        console.log(`Items:                ${itemCount}`);
        console.log(`DropEntries:          ${dropCount}`);
        console.log(`Drops sem sourceKey:  ${dropsWithoutSourceKey}`);
        console.log(`Mobs com drops:       ${mobsWithDrops}`);
        console.log(`Mobs sem drops:       ${mobsWithoutDrops}`);
        const sample = await prisma.dropEntry.findMany({
            where: {
                mobId: 1002,
            },
            orderBy: {
                sourceKey: "asc",
            },
            include: {
                mob: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                item: {
                    select: {
                        id: true,
                        aegisName: true,
                        name: true,
                    },
                },
            },
        });
        console.log("\n[PORING - MOB 1002]");
        console.log("-".repeat(60));
        for (const drop of sample) {
            console.log(`${drop.sourceKey} | ` +
                `Item ${drop.item.id} ${drop.item.aegisName} | ` +
                `${drop.item.name} | ` +
                `rate=${drop.rate} | ` +
                `stealProtected=${drop.stealProtected}`);
        }
        const poringOk = sample.length === 8 &&
            sample.every((drop) => drop.sourceKey !== null);
        console.log("\n[RESULTADO]");
        console.log("-".repeat(60));
        if (dropsWithoutSourceKey === 0 && poringOk) {
            console.log("[OK] Integridade dos drops validada.");
        }
        else {
            console.error("[FALHA] Existem problemas nos dados de drops.");
            process.exitCode = 1;
        }
        console.log("\n" + "=".repeat(60));
    }
    finally {
        await prisma.$disconnect();
    }
}
auditDatabaseDrops().catch((error) => {
    console.error("[AUDITORIA] Erro:", error);
    process.exitCode = 1;
});
