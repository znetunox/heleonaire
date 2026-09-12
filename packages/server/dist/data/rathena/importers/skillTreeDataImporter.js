import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";
import { parseSkillTree, resolveEffectiveSkillTree, } from "../parsers/skillTreeParser";
const prisma = new PrismaClient();
const DATASET = "skill_tree_data";
const SOURCE = "rathena";
const SOURCE_VERSION = "db/re";
/**
 * ============================================================
 * HELEONAIRE PLAYABLE JOBS
 * ============================================================
 *
 * These are the 25 custom playable classes.
 */
const HELEONAIRE_JOBS = [
    // Knight
    "SWORDMAN",
    "KNIGHT",
    "LORD_KNIGHT",
    "RUNE_KNIGHT",
    "DRAGON_KNIGHT",
    // Assassin
    "THIEF",
    "ASSASSIN",
    "ASSASSIN_CROSS",
    "GUILLOTINE_CROSS",
    "SHADOW_CROSS",
    // Archer
    "ARCHER",
    "HUNTER",
    "SNIPER",
    "RANGER",
    "WINDHAWK",
    // Mage
    "MAGE",
    "WIZARD",
    "HIGH_WIZARD",
    "WARLOCK",
    "ARCH_MAGE",
    // Cleric
    "ACOLYTE",
    "PRIEST",
    "HIGH_PRIEST",
    "ARCH_BISHOP",
    "CARDINAL",
];
function hash(value) {
    return createHash("sha256")
        .update(JSON.stringify(value))
        .digest("hex");
}
/**
 * ============================================================
 * VALIDATION
 * ============================================================
 */
function validateEffectiveSkill(skill, jobName) {
    if (!skill.name) {
        throw new Error(`Skill without name found in effective tree of ${jobName}.`);
    }
    if (skill.maxLevel <= 0) {
        throw new Error(`Invalid effective MaxLevel for ${jobName} -> ${skill.name}: ${skill.maxLevel}`);
    }
    if (skill.baseLevel !== undefined &&
        skill.baseLevel < 0) {
        throw new Error(`Invalid BaseLevel for ${jobName} -> ${skill.name}: ${skill.baseLevel}`);
    }
    if (skill.jobLevel !== undefined &&
        skill.jobLevel < 0) {
        throw new Error(`Invalid JobLevel for ${jobName} -> ${skill.name}: ${skill.jobLevel}`);
    }
    for (const requirement of skill.requires) {
        if (!requirement.name) {
            throw new Error(`Empty prerequisite skill name in ${jobName} -> ${skill.name}.`);
        }
        if (requirement.level <= 0) {
            throw new Error([
                `Invalid prerequisite level.`,
                `Job=${jobName}`,
                `Skill=${skill.name}`,
                `RequiredSkill=${requirement.name}`,
                `Level=${requirement.level}`,
            ].join(" "));
        }
    }
}
/**
 * ============================================================
 * MAIN IMPORTER
 * ============================================================
 */
async function importSkillTreeData() {
    console.log("[rAthena] Starting skill tree import...");
    // --------------------------------------------------------
    // PARSE
    // --------------------------------------------------------
    const parsed = parseSkillTree();
    console.log(`[rAthena] skill_tree jobs parsed: ${parsed.jobs.length}`);
    console.log(`[rAthena] skill_tree duplicates: ${parsed.duplicates}`);
    if (parsed.duplicates > 0) {
        throw new Error(`skill_tree.yml contains ${parsed.duplicates} duplicate job(s).`);
    }
    // --------------------------------------------------------
    // BUILD JOB MAP
    // --------------------------------------------------------
    const jobMap = new Map();
    for (const job of parsed.jobs) {
        jobMap.set(job.job, job);
    }
    // --------------------------------------------------------
    // VALIDATE HELEONAIRE JOB COVERAGE
    // --------------------------------------------------------
    const missingJobs = [];
    for (const jobName of HELEONAIRE_JOBS) {
        if (!jobMap.has(jobName)) {
            missingJobs.push(jobName);
        }
    }
    if (missingJobs.length > 0) {
        throw new Error([
            "Heleonaire skill tree import aborted.",
            `Missing ${missingJobs.length} playable job(s):`,
            missingJobs.join(", "),
        ].join(" "));
    }
    // --------------------------------------------------------
    // RESOLVE EFFECTIVE TREES
    // --------------------------------------------------------
    const effectiveTrees = new Map();
    let totalClassSkills = 0;
    let totalPrerequisites = 0;
    for (const jobName of HELEONAIRE_JOBS) {
        const effective = resolveEffectiveSkillTree(jobName, parsed.jobs);
        for (const skill of effective) {
            validateEffectiveSkill(skill, jobName);
        }
        effectiveTrees.set(jobName, effective);
        totalClassSkills += effective.length;
        totalPrerequisites += effective.reduce((total, skill) => total + skill.requires.length, 0);
        console.log(`[rAthena] ${jobName.padEnd(18)} ${effective.length} effective skills`);
    }
    console.log("");
    console.log(`[rAthena] total effective ClassSkill records: ${totalClassSkills}`);
    console.log(`[rAthena] total ClassSkillPrerequisite records: ${totalPrerequisites}`);
    // --------------------------------------------------------
    // LOAD DATABASE REFERENCES
    // --------------------------------------------------------
    const dbClasses = await prisma.gameClass.findMany({
        where: {
            aegisName: {
                in: [...HELEONAIRE_JOBS],
            },
        },
        select: {
            id: true,
            aegisName: true,
        },
    });
    const dbClassMap = new Map();
    for (const gameClass of dbClasses) {
        dbClassMap.set(gameClass.aegisName.toUpperCase(), gameClass.id);
    }
    const missingDbClasses = HELEONAIRE_JOBS.filter((jobName) => !dbClassMap.has(jobName));
    if (missingDbClasses.length > 0) {
        throw new Error([
            "GameClass records missing for playable jobs:",
            missingDbClasses.join(", "),
        ].join(" "));
    }
    // --------------------------------------------------------
    // LOAD ALL SKILLS
    // --------------------------------------------------------
    const skillRows = await prisma.skill.findMany({
        select: {
            id: true,
            aegisName: true,
        },
    });
    const skillMap = new Map();
    for (const skill of skillRows) {
        skillMap.set(skill.aegisName.toUpperCase(), skill.id);
    }
    // --------------------------------------------------------
    // VALIDATE ALL SKILL REFERENCES
    // BEFORE DATABASE MUTATION
    // --------------------------------------------------------
    const missingSkills = [];
    const missingPrerequisites = [];
    for (const jobName of HELEONAIRE_JOBS) {
        const effective = effectiveTrees.get(jobName) ?? [];
        for (const skill of effective) {
            if (!skillMap.has(skill.name)) {
                missingSkills.push({
                    job: jobName,
                    skill: skill.name,
                });
            }
            for (const requirement of skill.requires) {
                if (!skillMap.has(requirement.name)) {
                    missingPrerequisites.push({
                        job: jobName,
                        skill: skill.name,
                        requiredSkill: requirement.name,
                    });
                }
            }
        }
    }
    if (missingSkills.length > 0) {
        const details = missingSkills
            .slice(0, 50)
            .map((entry) => `${entry.job} -> ${entry.skill}`)
            .join(", ");
        throw new Error([
            `Missing ${missingSkills.length} skill(s) in Skill table.`,
            `Import skill_db.yml before skill_tree.yml.`,
            `Examples: ${details}`,
        ].join(" "));
    }
    if (missingPrerequisites.length > 0) {
        const details = missingPrerequisites
            .slice(0, 50)
            .map((entry) => `${entry.job} -> ${entry.skill} requires ${entry.requiredSkill}`)
            .join(", ");
        throw new Error([
            `Missing ${missingPrerequisites.length} prerequisite skill(s) in Skill table.`,
            `Examples: ${details}`,
        ].join(" "));
    }
    // --------------------------------------------------------
    // BASE LEVEL AUDIT
    // --------------------------------------------------------
    //
    // Current ClassSkill schema does not have BaseLevel.
    //
    // Audit only. Do not silently convert BaseLevel to JobLevel.
    // --------------------------------------------------------
    let baseLevelEntries = 0;
    for (const jobName of HELEONAIRE_JOBS) {
        const effective = effectiveTrees.get(jobName) ?? [];
        for (const skill of effective) {
            if (skill.baseLevel !== undefined) {
                baseLevelEntries++;
            }
        }
    }
    if (baseLevelEntries > 0) {
        console.warn([
            `[rAthena] Warning: ${baseLevelEntries}`,
            `effective skill entries contain BaseLevel,`,
            `but ClassSkill has no BaseLevel column.`,
            `BaseLevel will not be persisted.`,
        ].join(" "));
    }
    // --------------------------------------------------------
    // DATABASE IMPORT
    // --------------------------------------------------------
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsDeleted = 0;
    try {
        await prisma.$transaction(async (tx) => {
            const classIds = [...dbClassMap.values()];
            // ------------------------------------------------
            // CLEAN EXISTING CLASS SKILL DATA
            //
            // ClassSkillPrerequisite has:
            //
            // onDelete: Cascade
            //
            // therefore deleting ClassSkill automatically
            // deletes its class-specific prerequisites.
            // ------------------------------------------------
            const deletedClassSkills = await tx.classSkill.deleteMany({
                where: {
                    classId: {
                        in: classIds,
                    },
                },
            });
            recordsDeleted +=
                deletedClassSkills.count;
            // ------------------------------------------------
            // INSERT CLASS SKILLS + PREREQUISITES
            //
            // IMPORTANT:
            //
            // Prerequisites are created INSIDE the specific
            // ClassSkill.
            //
            // This is what allows:
            //
            // MAGE -> MG_SAFETYWALL
            //
            // to have different prerequisites from:
            //
            // PRIEST -> MG_SAFETYWALL
            // ------------------------------------------------
            for (const jobName of HELEONAIRE_JOBS) {
                const classId = dbClassMap.get(jobName);
                if (classId === undefined) {
                    throw new Error(`GameClass not found during transaction: ${jobName}`);
                }
                const effective = effectiveTrees.get(jobName) ?? [];
                for (const skill of effective) {
                    const skillId = skillMap.get(skill.name);
                    if (skillId === undefined) {
                        throw new Error(`Skill not found during transaction: ${skill.name}`);
                    }
                    const prerequisiteData = skill.requires.map((requirement) => {
                        const requiredSkillId = skillMap.get(requirement.name);
                        if (requiredSkillId ===
                            undefined) {
                            throw new Error([
                                `Required skill not found:`,
                                `${requirement.name}`,
                                `for ${jobName} -> ${skill.name}`,
                            ].join(" "));
                        }
                        return {
                            requiredSkillId,
                            requiredLevel: requirement.level,
                        };
                    });
                    await tx.classSkill.create({
                        data: {
                            classId,
                            skillId,
                            maxLevel: skill.maxLevel,
                            requiredJobLevel: skill.jobLevel ??
                                0,
                            prerequisites: {
                                create: prerequisiteData,
                            },
                        },
                    });
                    recordsCreated++;
                    recordsCreated +=
                        prerequisiteData.length;
                }
            }
        }, {
            timeout: 120000,
        });
        // --------------------------------------------------------
        // DATA IMPORT TRACKING
        // --------------------------------------------------------
        const datasetHash = hash([...effectiveTrees.entries()]);
        await prisma.dataImport.create({
            data: {
                dataset: DATASET,
                source: SOURCE,
                sourceVersion: SOURCE_VERSION,
                recordsCreated,
                recordsUpdated,
                recordsDeleted,
                success: true,
                errorMessage: `effectiveTreeHash=${datasetHash}`,
            },
        });
        // --------------------------------------------------------
        // FINAL REPORT
        // --------------------------------------------------------
        console.log("");
        console.log("==============================================");
        console.log("Skill Tree import completed successfully");
        console.log("==============================================");
        console.log(`Playable jobs:             ${HELEONAIRE_JOBS.length}`);
        console.log(`ClassSkill records:        ${totalClassSkills}`);
        console.log(`Prerequisite records:      ${totalPrerequisites}`);
        console.log(`Records created:           ${recordsCreated}`);
        console.log(`Records updated:           ${recordsUpdated}`);
        console.log(`Records deleted:           ${recordsDeleted}`);
        console.log("==============================================");
    }
    catch (error) {
        const errorMessage = error instanceof Error
            ? error.message
            : String(error);
        await prisma.dataImport.create({
            data: {
                dataset: DATASET,
                source: SOURCE,
                sourceVersion: SOURCE_VERSION,
                recordsCreated: 0,
                recordsUpdated: 0,
                recordsDeleted: 0,
                success: false,
                errorMessage,
            },
        });
        console.error("");
        console.error("==============================================");
        console.error("Skill Tree import FAILED");
        console.error("==============================================");
        console.error(errorMessage);
        console.error("==============================================");
        throw error;
    }
}
/**
 * ============================================================
 * ENTRY POINT
 * ============================================================
 */
if (require.main === module) {
    importSkillTreeData()
        .catch(() => {
        process.exitCode = 1;
    })
        .finally(async () => {
        await prisma.$disconnect();
    });
}
export { importSkillTreeData };
