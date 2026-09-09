import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function auditClassData() {
    console.log("");
    console.log("========================================");
    console.log("         HELEONAIRE CLASS DB AUDIT");
    console.log("========================================");
    console.log("");
    let errors = 0;
    // ============================================================
    // GAME CLASS
    // ============================================================
    console.log("[Audit] Checking GameClass...");
    const classes = await prisma.gameClass.findMany({
        orderBy: {
            id: "asc",
        },
    });
    console.log(`[Audit] GameClass count: ${classes.length}`);
    if (classes.length !== 25) {
        console.error(`[ERROR] Expected 25 GameClass records, got ${classes.length}`);
        errors++;
    }
    const playableClasses = classes.filter((gameClass) => gameClass.heleonaireClass !== null);
    console.log(`[Audit] Playable class records: ${playableClasses.length}`);
    if (playableClasses.length !== 25) {
        console.error(`[ERROR] Expected 25 playable classes, got ${playableClasses.length}`);
        errors++;
    }
    // ============================================================
    // PROGRESSION
    // ============================================================
    console.log("");
    console.log("[Audit] Checking class progression...");
    for (const gameClass of playableClasses) {
        const parent = gameClass.parentId
            ? classes.find((candidate) => candidate.id === gameClass.parentId)
            : null;
        console.log(`  ${gameClass.aegisName.padEnd(20)} | ` +
            `id=${String(gameClass.id).padEnd(5)} | ` +
            `parent=${parent?.aegisName ?? "-"}`);
    }
    // ============================================================
    // STAT GROWTH
    // ============================================================
    console.log("");
    console.log("[Audit] Checking ClassStatGrowth...");
    const statGrowthCount = await prisma.classStatGrowth.count();
    console.log(`[Audit] ClassStatGrowth count: ${statGrowthCount}`);
    if (statGrowthCount !== 956) {
        console.error(`[ERROR] Expected 956 ClassStatGrowth records, got ${statGrowthCount}`);
        errors++;
    }
    // ============================================================
    // ASPD
    // ============================================================
    console.log("");
    console.log("[Audit] Checking ClassAspd...");
    const aspdCount = await prisma.classAspd.count();
    console.log(`[Audit] ClassAspd count: ${aspdCount}`);
    if (aspdCount !== 182) {
        console.error(`[ERROR] Expected 182 ClassAspd records, got ${aspdCount}`);
        errors++;
    }
    // ============================================================
    // STAT POINT TABLE
    // ============================================================
    console.log("");
    console.log("[Audit] Checking StatPointTable...");
    const statPointCount = await prisma.statPointTable.count();
    console.log(`[Audit] StatPointTable count: ${statPointCount}`);
    if (statPointCount !== 275) {
        console.error(`[ERROR] Expected 275 StatPointTable records, got ${statPointCount}`);
        errors++;
    }
    // ============================================================
    // SAMPLE DATA
    // ============================================================
    console.log("");
    console.log("[Audit] Checking sample data...");
    const knight = await prisma.gameClass.findUnique({
        where: {
            id: 7,
        },
        include: {
            statGrowth: {
                orderBy: {
                    level: "asc",
                },
                take: 5,
            },
            aspd: {
                orderBy: {
                    weaponType: "asc",
                },
            },
        },
    });
    if (!knight) {
        console.error("[ERROR] KNIGHT (id=7) not found.");
        errors++;
    }
    else {
        console.log("");
        console.log("KNIGHT SAMPLE");
        console.log("----------------------------------------");
        console.log(`ID:       ${knight.id}`);
        console.log(`Name:     ${knight.aegisName}`);
        console.log(`Class:    ${knight.heleonaireClass}`);
        console.log(`Parent:   ${knight.parentId ?? "-"}`);
        console.log("");
        console.log("Stat Growth:");
        for (const row of knight.statGrowth) {
            console.log(`  Lv ${String(row.level).padStart(2)} | ` +
                `STR ${String(row.str).padStart(2)} | ` +
                `AGI ${String(row.agi).padStart(2)} | ` +
                `VIT ${String(row.vit).padStart(2)} | ` +
                `INT ${String(row.int).padStart(2)} | ` +
                `DEX ${String(row.dex).padStart(2)} | ` +
                `LUK ${String(row.luk).padStart(2)}`);
        }
        console.log("");
        console.log("ASPD:");
        for (const row of knight.aspd) {
            console.log(`  ${row.weaponType.padEnd(20)} | ${row.aspd}`);
        }
    }
    // ============================================================
    // STAT POINT SAMPLE
    // ============================================================
    const statPoints = await prisma.statPointTable.findMany({
        orderBy: {
            level: "asc",
        },
        take: 10,
    });
    console.log("");
    console.log("STAT POINT SAMPLE");
    console.log("----------------------------------------");
    for (const row of statPoints) {
        console.log(`  Lv ${String(row.level).padStart(3)} | ` +
            `points=${String(row.points).padStart(4)} | ` +
            `traitPoints=${row.traitPoints ?? "-"}`);
    }
    // ============================================================
    // RESULT
    // ============================================================
    console.log("");
    console.log("========================================");
    if (errors === 0) {
        console.log("       CLASS DB AUDIT PASSED");
    }
    else {
        console.log(`       CLASS DB AUDIT FAILED (${errors} errors)`);
    }
    console.log("========================================");
    console.log("");
    if (errors > 0) {
        process.exitCode = 1;
    }
}
auditClassData()
    .catch((error) => {
    console.error("");
    console.error("[Audit] FAILED");
    console.error("");
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
