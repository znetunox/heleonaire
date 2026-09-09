import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";
import { parseJobCatalog } from "../jobCatalogParser";
import { parseJobStats } from "../parsers/jobStatsParser";
import { parseJobAspd } from "../parsers/jobAspdParser";
import { parseStatPoints } from "../parsers/statpointParser";
import { normalizeJobName } from "../jobName";
const prisma = new PrismaClient();
function hash(value) {
    return createHash("sha256")
        .update(JSON.stringify(value))
        .digest("hex");
}
function buildStatsGroupMap() {
    const parsed = parseJobStats();
    const map = new Map();
    parsed.groups.forEach((group, index) => {
        const groupIndex = index + 1;
        for (const rawJob of group.jobs) {
            const job = normalizeJobName(rawJob);
            if (!map.has(job)) {
                map.set(job, {
                    groupIndex,
                    group,
                });
            }
        }
    });
    return map;
}
function buildAspdMap() {
    const parsed = parseJobAspd();
    const map = new Map();
    for (const group of parsed.groups) {
        for (const rawJob of group.jobs) {
            const job = normalizeJobName(rawJob);
            if (!map.has(job)) {
                map.set(job, new Map());
            }
            const existing = map.get(job);
            for (const [weaponType, aspd] of group.baseASPD) {
                existing.set(weaponType, aspd);
            }
        }
    }
    return map;
}
export async function importClassData() {
    console.log("");
    console.log("========================================");
    console.log("       HELEONAIRE CLASS IMPORT");
    console.log("========================================");
    console.log("");
    const catalog = parseJobCatalog();
    const statsMap = buildStatsGroupMap();
    const aspdMap = buildAspdMap();
    const statPoints = parseStatPoints();
    if (catalog.jobs.length !== 25) {
        throw new Error(`[ClassImporter] Expected 25 Heleonaire jobs, got ${catalog.jobs.length}`);
    }
    if (catalog.missingFromMmo.length > 0) {
        throw new Error(`[ClassImporter] Missing mmo.hpp jobs: ${catalog.missingFromMmo.join(", ")}`);
    }
    if (catalog.missingStats.length > 0) {
        throw new Error(`[ClassImporter] Missing job_stats jobs: ${catalog.missingStats.join(", ")}`);
    }
    if (catalog.missingSkillTree.length > 0) {
        throw new Error(`[ClassImporter] Missing skill_tree jobs: ${catalog.missingSkillTree.join(", ")}`);
    }
    // ============================================================
    // VALIDATE ASPD
    // ============================================================
    const missingAspd = [];
    for (const job of catalog.jobs) {
        if (!aspdMap.has(normalizeJobName(job.job))) {
            missingAspd.push(job.job);
        }
    }
    if (missingAspd.length > 0) {
        throw new Error(`[ClassImporter] Missing job_aspd jobs: ${missingAspd.join(", ")}`);
    }
    // ============================================================
    // GAME CLASSES
    // ============================================================
    console.log("[ClassImporter] Importing GameClass...");
    const classIdMap = new Map();
    for (const job of catalog.jobs) {
        const result = await prisma.gameClass.upsert({
            where: {
                id: job.id,
            },
            create: {
                id: job.id,
                aegisName: job.job,
                name: job.job,
                parentId: null,
                baseJobId: null,
                jobLevel: null,
                heleonaireClass: job.heleonaireClass,
                source: "rathena",
                sourceHash: hash(job),
            },
            update: {
                aegisName: job.job,
                name: job.job,
                heleonaireClass: job.heleonaireClass,
                source: "rathena",
                sourceHash: hash(job),
            },
        });
        classIdMap.set(job.job, result.id);
    }
    // ============================================================
    // CUSTOM PARENT RELATION
    // ============================================================
    console.log("[ClassImporter] Updating class progression...");
    for (const job of catalog.jobs) {
        const parentId = job.parentJob
            ? classIdMap.get(normalizeJobName(job.parentJob))
            : null;
        await prisma.gameClass.update({
            where: {
                id: job.id,
            },
            data: {
                parentId: parentId ?? null,
            },
        });
    }
    // ============================================================
    // CLASS STAT GROWTH
    // ============================================================
    console.log("[ClassImporter] Importing ClassStatGrowth...");
    let statGrowthRows = 0;
    for (const job of catalog.jobs) {
        const jobName = normalizeJobName(job.job);
        const statsEntry = statsMap.get(jobName);
        if (!statsEntry) {
            throw new Error(`[ClassImporter] Stats group not found for ${jobName}`);
        }
        await prisma.classStatGrowth.deleteMany({
            where: {
                classId: job.id,
            },
        });
        const rows = statsEntry.group.bonusStats.map((entry) => ({
            classId: job.id,
            level: entry.level,
            str: entry.str ?? 0,
            agi: entry.agi ?? 0,
            vit: entry.vit ?? 0,
            int: entry.int ?? 0,
            dex: entry.dex ?? 0,
            luk: entry.luk ?? 0,
        }));
        if (rows.length > 0) {
            await prisma.classStatGrowth.createMany({
                data: rows,
            });
            statGrowthRows += rows.length;
        }
    }
    // ============================================================
    // CLASS ASPD
    // ============================================================
    console.log("[ClassImporter] Importing ClassAspd...");
    let aspdRows = 0;
    for (const job of catalog.jobs) {
        const jobName = normalizeJobName(job.job);
        const weaponAspd = aspdMap.get(jobName);
        if (!weaponAspd) {
            throw new Error(`[ClassImporter] ASPD data not found for ${jobName}`);
        }
        await prisma.classAspd.deleteMany({
            where: {
                classId: job.id,
            },
        });
        const rows = Array.from(weaponAspd.entries()).map(([weaponType, aspd]) => ({
            classId: job.id,
            weaponType,
            aspd,
        }));
        if (rows.length > 0) {
            await prisma.classAspd.createMany({
                data: rows,
            });
            aspdRows += rows.length;
        }
    }
    // ============================================================
    // CLASS STAT CONFIG
    // ============================================================
    console.log("[ClassImporter] Importing ClassStatConfig...");
    let statConfigRows = 0;
    for (const job of catalog.jobs) {
        const jobName = normalizeJobName(job.job);
        const statsEntry = statsMap.get(jobName);
        if (!statsEntry) {
            throw new Error(`[ClassImporter] Stats group not found for ${jobName}`);
        }
        const group = statsEntry.group;
        await prisma.classStatConfig.upsert({
            where: {
                classId: job.id,
            },
            create: {
                classId: job.id,
                maxWeight: group.maxWeight ?? null,
                hpFactor: group.hpFactor ?? null,
                hpIncrease: group.hpIncrease ?? null,
                spFactor: group.spFactor ?? null,
                spIncrease: group.spIncrease ?? null,
                apFactor: group.apFactor ?? null,
                apIncrease: group.apIncrease ?? null,
            },
            update: {
                maxWeight: group.maxWeight ?? null,
                hpFactor: group.hpFactor ?? null,
                hpIncrease: group.hpIncrease ?? null,
                spFactor: group.spFactor ?? null,
                spIncrease: group.spIncrease ?? null,
                apFactor: group.apFactor ?? null,
                apIncrease: group.apIncrease ?? null,
            },
        });
        statConfigRows++;
    }
    // ============================================================
    // GLOBAL STAT POINTS
    // ============================================================
    console.log("[ClassImporter] Importing StatPointTable...");
    await prisma.statPointTable.deleteMany();
    if (statPoints.entries.length > 0) {
        await prisma.statPointTable.createMany({
            data: statPoints.entries.map((entry) => ({
                level: entry.level,
                points: entry.points,
                traitPoints: entry.traitPoints,
                source: "rathena",
                sourceHash: hash(entry),
            })),
        });
    }
    // ============================================================
    // DATA IMPORT TRACKING
    // ============================================================
    await prisma.dataImport.create({
        data: {
            dataset: "class_data",
            source: "rathena",
            sourceVersion: "db/re",
            recordsCreated: catalog.jobs.length +
                statGrowthRows +
                statConfigRows +
                aspdRows +
                statPoints.entries.length,
            recordsUpdated: 0,
            success: true,
        },
    });
    console.log("");
    console.log("========================================");
    console.log("             IMPORT RESULT");
    console.log("========================================");
    console.log("");
    console.log(`GameClass:           ${catalog.jobs.length}`);
    console.log(`StatGrowth rows:     ${statGrowthRows}`);
    console.log(`StatConfig rows:     ${statConfigRows}`);
    console.log(`ASPD rows:           ${aspdRows}`);
    console.log(`StatPoint rows:      ${statPoints.entries.length}`);
    console.log("");
    console.log("CLASS DATA IMPORT FINISHED");
}
if (require.main === module) {
    importClassData()
        .catch((error) => {
        console.error("");
        console.error("[ClassImporter] IMPORT FAILED");
        console.error("");
        console.error(error);
        process.exitCode = 1;
    })
        .finally(async () => {
        await prisma.$disconnect();
    });
}
