import { createHash } from "crypto";
import { prisma } from "../../../db/prisma";
import { parseJobExp } from "../parsers/jobExpParser";
import { parseJobCatalog } from "../jobCatalogParser";
import { normalizeJobName } from "../jobName";
const DATASET = "job_exp_data";
const SOURCE = "rathena";
const SOURCE_VERSION = "db/re";
function hash(value) {
    return createHash("sha256")
        .update(JSON.stringify(value, (_key, currentValue) => typeof currentValue === "bigint"
        ? currentValue.toString()
        : currentValue))
        .digest("hex");
}
function createSourceKey(jobs) {
    return jobs
        .map((job) => normalizeJobName(job))
        .sort()
        .join("|");
}
export async function importJobExpData() {
    console.log("");
    console.log("========================================");
    console.log("       HELEONAIRE JOB EXP IMPORT");
    console.log("========================================");
    console.log("");
    const groups = parseJobExp();
    const catalog = parseJobCatalog();
    console.log(`[JobExpImporter] Groups parsed: ${groups.length}`);
    if (groups.length === 0) {
        throw new Error("[JobExpImporter] No Job EXP groups found.");
    }
    const playableJobs = catalog.jobs.filter((job) => job.playable);
    if (playableJobs.length !== 25) {
        throw new Error(`[JobExpImporter] Expected 25 playable jobs, got ${playableJobs.length}`);
    }
    // ------------------------------------------------------------
    // Build source group lookup from parsed rAthena data
    // ------------------------------------------------------------
    const groupByJob = new Map();
    for (const group of groups) {
        for (const rawJob of group.jobs) {
            const jobName = normalizeJobName(rawJob);
            if (groupByJob.has(jobName)) {
                throw new Error(`[JobExpImporter] Job belongs to multiple Job EXP groups: ${jobName}`);
            }
            groupByJob.set(jobName, group);
        }
    }
    // ------------------------------------------------------------
    // Validate all playable jobs before touching the database
    // ------------------------------------------------------------
    for (const job of playableJobs) {
        const jobName = normalizeJobName(job.job);
        if (!groupByJob.has(jobName)) {
            throw new Error(`[JobExpImporter] Job EXP group not found for ${jobName}`);
        }
    }
    // ------------------------------------------------------------
    // Import
    // ------------------------------------------------------------
    let groupsCreated = 0;
    let groupsUpdated = 0;
    let entriesCreated = 0;
    let classesLinked = 0;
    await prisma.$transaction(async (tx) => {
        // ==========================================================
        // JOB EXP GROUPS
        // ==========================================================
        for (const group of groups) {
            const normalizedJobs = group.jobs
                .map((job) => normalizeJobName(job))
                .sort();
            const sourceKey = createSourceKey(group.jobs);
            const sourceHash = hash({
                jobs: normalizedJobs,
                maxJobLevel: group.maxJobLevel,
                entries: group.entries,
            });
            const existing = await tx.jobExpGroup.findUnique({
                where: {
                    sourceKey,
                },
            });
            let groupId;
            if (existing) {
                const updated = await tx.jobExpGroup.update({
                    where: {
                        id: existing.id,
                    },
                    data: {
                        source: SOURCE,
                        sourceHash,
                        maxJobLevel: group.maxJobLevel,
                    },
                });
                groupId = updated.id;
                groupsUpdated++;
            }
            else {
                const created = await tx.jobExpGroup.create({
                    data: {
                        sourceKey,
                        source: SOURCE,
                        sourceHash,
                        maxJobLevel: group.maxJobLevel,
                    },
                });
                groupId = created.id;
                groupsCreated++;
            }
            // Replace entries for deterministic reimport.
            await tx.jobExpEntry.deleteMany({
                where: {
                    groupId,
                },
            });
            if (group.entries.length > 0) {
                await tx.jobExpEntry.createMany({
                    data: group.entries.map((entry) => ({
                        groupId,
                        level: entry.level,
                        exp: entry.exp,
                    })),
                });
                entriesCreated += group.entries.length;
            }
            console.log(`[JobExpImporter] Group #${group.index} | ` +
                `${group.jobs.length} jobs | ` +
                `MaxJobLevel=${group.maxJobLevel} | ` +
                `Entries=${group.entries.length}`);
        }
        // ==========================================================
        // LINK GAME CLASSES
        // ==========================================================
        console.log("");
        console.log("[JobExpImporter] Linking GameClass → JobExpGroup...");
        for (const job of playableJobs) {
            const jobName = normalizeJobName(job.job);
            const sourceGroup = groupByJob.get(jobName);
            if (!sourceGroup) {
                throw new Error(`[JobExpImporter] Source group missing for ${jobName}`);
            }
            const sourceKey = createSourceKey(sourceGroup.jobs);
            const group = await tx.jobExpGroup.findUnique({
                where: {
                    sourceKey,
                },
            });
            if (!group) {
                throw new Error(`[JobExpImporter] Persisted group not found for ${jobName}`);
            }
            const gameClass = await tx.gameClass.findUnique({
                where: {
                    aegisName: job.job,
                },
            });
            if (!gameClass) {
                throw new Error(`[JobExpImporter] GameClass not found: ${job.job}`);
            }
            await tx.gameClass.update({
                where: {
                    id: gameClass.id,
                },
                data: {
                    jobExpGroupId: group.id,
                },
            });
            classesLinked++;
        }
        // ==========================================================
        // IMPORT TRACKING
        // ==========================================================
        await tx.dataImport.create({
            data: {
                dataset: DATASET,
                source: SOURCE,
                sourceVersion: SOURCE_VERSION,
                recordsCreated: groupsCreated +
                    entriesCreated +
                    classesLinked,
                recordsUpdated: groupsUpdated,
                success: true,
            },
        });
    });
    console.log("");
    console.log("========================================");
    console.log("          JOB EXP IMPORT RESULT");
    console.log("========================================");
    console.log("");
    console.log(`Groups parsed:       ${groups.length}`);
    console.log(`Groups created:      ${groupsCreated}`);
    console.log(`Groups updated:      ${groupsUpdated}`);
    console.log(`Entries imported:    ${entriesCreated}`);
    console.log(`Classes linked:      ${classesLinked}`);
    console.log("");
    console.log("JOB EXP IMPORT FINISHED");
}
if (require.main === module) {
    importJobExpData()
        .catch((error) => {
        console.error("");
        console.error("[JobExpImporter] IMPORT FAILED");
        console.error("");
        console.error(error);
        process.exitCode = 1;
    })
        .finally(async () => {
        await prisma.$disconnect();
    });
}
