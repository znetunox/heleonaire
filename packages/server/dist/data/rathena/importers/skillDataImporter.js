import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";
import { parseSkillDb } from "../parsers/skillDbParser";
const prisma = new PrismaClient();
const DATASET = "skill_data";
const SOURCE = "rathena";
const SOURCE_VERSION = "db/re";
function hash(value) {
    return createHash("sha256")
        .update(JSON.stringify(value))
        .digest("hex");
}
function normalizeName(value) {
    return value.trim().toLowerCase();
}
function chunk(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}
async function resolveRequiredItems(skillDefinitions) {
    const requiredNames = new Set();
    for (const skill of skillDefinitions) {
        for (const requirement of skill.requirements) {
            for (const itemCost of requirement.itemCosts) {
                requiredNames.add(itemCost.item);
            }
        }
    }
    if (requiredNames.size === 0) {
        return new Map();
    }
    const normalizedNames = new Set([...requiredNames].map(normalizeName));
    const items = await prisma.item.findMany({
        select: {
            id: true,
            aegisName: true,
        },
    });
    const itemMap = new Map();
    for (const item of items) {
        itemMap.set(normalizeName(item.aegisName), item.id);
    }
    const missing = [];
    for (const name of normalizedNames) {
        if (!itemMap.has(name)) {
            missing.push(name);
        }
    }
    if (missing.length > 0) {
        const examples = missing
            .sort()
            .slice(0, 50)
            .join(", ");
        throw new Error([
            `Skill DB import aborted.`,
            `Missing ${missing.length} item(s) referenced by skill requirements.`,
            `The Item table must be imported before skill_data.`,
            `Missing items: ${examples}`,
        ].join(" "));
    }
    const resolved = new Map();
    for (const name of requiredNames) {
        const itemId = itemMap.get(normalizeName(name));
        if (itemId === undefined) {
            throw new Error(`Failed to resolve skill requirement item: ${name}`);
        }
        resolved.set(name, itemId);
    }
    return resolved;
}
async function importSkillData() {
    console.log("[rAthena] Starting skill DB import...");
    const parsed = parseSkillDb();
    console.log(`[rAthena] skill_db.yml source: rathena`);
    console.log(`[rAthena] skills parsed: ${parsed.skills.length}`);
    console.log(`[rAthena] skill duplicates: ${parsed.duplicates}`);
    if (parsed.duplicates > 0) {
        throw new Error(`skill_db.yml contains ${parsed.duplicates} duplicate skill ID(s).`);
    }
    if (parsed.skills.length === 0) {
        throw new Error("skill_db.yml produced zero skills. Import aborted.");
    }
    // ----------------------------------------------------------
    // BASIC VALIDATION
    // ----------------------------------------------------------
    const skillIds = new Set();
    const skillNames = new Set();
    for (const skill of parsed.skills) {
        if (skillIds.has(skill.id)) {
            throw new Error(`Duplicate skill ID detected: ${skill.id}`);
        }
        if (skillNames.has(skill.aegisName)) {
            throw new Error(`Duplicate skill AegisName detected: ${skill.aegisName}`);
        }
        if (skill.id <= 0) {
            throw new Error(`Invalid skill ID: ${skill.id} (${skill.aegisName})`);
        }
        if (skill.maxLevel <= 0) {
            throw new Error(`Invalid MaxLevel for ${skill.aegisName}: ${skill.maxLevel}`);
        }
        skillIds.add(skill.id);
        skillNames.add(skill.aegisName);
    }
    // ----------------------------------------------------------
    // RESOLVE ITEM COSTS BEFORE STARTING TRANSACTION
    // ----------------------------------------------------------
    const itemMap = await resolveRequiredItems(parsed.skills);
    console.log(`[rAthena] skill requirement items resolved: ${itemMap.size}`);
    // ----------------------------------------------------------
    // EXPECTED COUNTS
    // ----------------------------------------------------------
    const expectedLevels = parsed.skills.reduce((total, skill) => total + skill.levels.length, 0);
    const expectedRequirements = parsed.skills.reduce((total, skill) => total + skill.requirements.length, 0);
    const expectedRequirementItems = parsed.skills.reduce((total, skill) => total +
        skill.requirements.reduce((reqTotal, requirement) => reqTotal + requirement.itemCosts.length, 0), 0);
    const expectedUnits = parsed.skills.reduce((total, skill) => total + skill.units.length, 0);
    const expectedUnitLevels = parsed.skills.reduce((total, skill) => total +
        skill.units.reduce((unitTotal, unit) => unitTotal + unit.levels.length, 0), 0);
    console.log(`[rAthena] expected Skill records: ${parsed.skills.length}`);
    console.log(`[rAthena] expected SkillLevel records: ${expectedLevels}`);
    console.log(`[rAthena] expected SkillRequirement records: ${expectedRequirements}`);
    console.log(`[rAthena] expected SkillRequirementItem records: ${expectedRequirementItems}`);
    console.log(`[rAthena] expected SkillUnit records: ${expectedUnits}`);
    console.log(`[rAthena] expected SkillUnitLevel records: ${expectedUnitLevels}`);
    // ----------------------------------------------------------
    // IMPORT
    // ----------------------------------------------------------
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsDeleted = 0;
    try {
        await prisma.$transaction(async (tx) => {
            const ids = [...skillIds];
            // ----------------------------------------------------
            // CLEAN EXISTING CHILD DATA
            //
            // Only imported skill IDs are touched.
            // Existing ClassSkill / SkillPrerequisite /
            // CharacterSkill rows are NOT manually deleted.
            // ----------------------------------------------------
            const oldRequirementItems = await tx.skillRequirementItem.deleteMany({
                where: {
                    requirement: {
                        skillId: {
                            in: ids,
                        },
                    },
                },
            });
            recordsDeleted += oldRequirementItems.count;
            const oldUnitLevels = await tx.skillUnitLevel.deleteMany({
                where: {
                    skillUnit: {
                        skillId: {
                            in: ids,
                        },
                    },
                },
            });
            recordsDeleted += oldUnitLevels.count;
            const oldRequirements = await tx.skillRequirement.deleteMany({
                where: {
                    skillId: {
                        in: ids,
                    },
                },
            });
            recordsDeleted += oldRequirements.count;
            const oldUnits = await tx.skillUnit.deleteMany({
                where: {
                    skillId: {
                        in: ids,
                    },
                },
            });
            recordsDeleted += oldUnits.count;
            const oldLevels = await tx.skillLevel.deleteMany({
                where: {
                    skillId: {
                        in: ids,
                    },
                },
            });
            recordsDeleted += oldLevels.count;
            // ----------------------------------------------------
            // UPSERT SKILL MASTER RECORDS
            // ----------------------------------------------------
            for (const skill of parsed.skills) {
                const existing = await tx.skill.findUnique({
                    where: {
                        id: skill.id,
                    },
                    select: {
                        id: true,
                    },
                });
                await tx.skill.upsert({
                    where: {
                        id: skill.id,
                    },
                    create: {
                        id: skill.id,
                        aegisName: skill.aegisName,
                        description: skill.description,
                        maxLevel: skill.maxLevel,
                        type: skill.type,
                        targetType: skill.targetType,
                        hit: skill.hit,
                        damageFlags: skill.damageFlags,
                        flags: skill.flags,
                        range: skill.range,
                        castCancel: skill.castCancel,
                        castDefenseReduction: skill.castDefenseReduction,
                        castTimeFlags: skill.castTimeFlags,
                        castDelayFlags: skill.castDelayFlags,
                        copyFlags: skill.copyFlags,
                        removeRequirement: skill.removeRequirement,
                        noNearNpc: skill.noNearNpc,
                        additionalRange: skill.additionalRange,
                        noNearNpcType: skill.noNearNpcType,
                        source: SOURCE,
                        sourceHash: hash(skill),
                    },
                    update: {
                        aegisName: skill.aegisName,
                        description: skill.description,
                        maxLevel: skill.maxLevel,
                        type: skill.type,
                        targetType: skill.targetType,
                        hit: skill.hit,
                        damageFlags: skill.damageFlags,
                        flags: skill.flags,
                        range: skill.range,
                        castCancel: skill.castCancel,
                        castDefenseReduction: skill.castDefenseReduction,
                        castTimeFlags: skill.castTimeFlags,
                        castDelayFlags: skill.castDelayFlags,
                        copyFlags: skill.copyFlags,
                        removeRequirement: skill.removeRequirement,
                        noNearNpc: skill.noNearNpc,
                        additionalRange: skill.additionalRange,
                        noNearNpcType: skill.noNearNpcType,
                        source: SOURCE,
                        sourceHash: hash(skill),
                    },
                });
                if (existing) {
                    recordsUpdated++;
                }
                else {
                    recordsCreated++;
                }
            }
            // ----------------------------------------------------
            // SKILL LEVELS
            // ----------------------------------------------------
            for (const skill of parsed.skills) {
                if (skill.levels.length === 0) {
                    continue;
                }
                await tx.skillLevel.createMany({
                    data: skill.levels.map((level) => ({
                        skillId: skill.id,
                        level: level.level,
                        range: level.range,
                        hitCount: level.hitCount,
                        element: level.element,
                        splashArea: level.splashArea,
                        activeInstance: level.activeInstance,
                        knockback: level.knockback,
                        giveAp: level.giveAp,
                        castTime: level.castTime,
                        afterCastActDelay: level.afterCastActDelay,
                        afterCastWalkDelay: level.afterCastWalkDelay,
                        duration1: level.duration1,
                        duration2: level.duration2,
                        cooldown: level.cooldown,
                        fixedCastTime: level.fixedCastTime,
                    })),
                });
            }
            // ----------------------------------------------------
            // REQUIREMENTS
            // ----------------------------------------------------
            for (const skill of parsed.skills) {
                for (const requirement of skill.requirements) {
                    const createdRequirement = await tx.skillRequirement.create({
                        data: {
                            skillId: skill.id,
                            level: requirement.level,
                            hpCost: requirement.hpCost,
                            spCost: requirement.spCost,
                            apCost: requirement.apCost,
                            hpRateCost: requirement.hpRateCost,
                            spRateCost: requirement.spRateCost,
                            apRateCost: requirement.apRateCost,
                            maxHpTrigger: requirement.maxHpTrigger,
                            zenyCost: requirement.zenyCost,
                            weapon: requirement.weapon,
                            ammo: requirement.ammo,
                            ammoAmount: requirement.ammoAmount,
                            state: requirement.state,
                            status: requirement.status,
                            spiritSphereCost: requirement.spiritSphereCost,
                            equipment: requirement.equipment,
                        },
                    });
                    // ------------------------------------------------
                    // ITEM COSTS
                    // ------------------------------------------------
                    if (requirement.itemCosts.length > 0) {
                        const itemCosts = requirement.itemCosts.map((itemCost) => {
                            const itemId = itemMap.get(itemCost.item);
                            if (itemId === undefined) {
                                throw new Error([
                                    `Could not resolve item`,
                                    `"${itemCost.item}"`,
                                    `for skill`,
                                    `"${skill.aegisName}"`,
                                ].join(" "));
                            }
                            return {
                                requirementId: createdRequirement.id,
                                itemId,
                                amount: itemCost.amount,
                                level: itemCost.level,
                            };
                        });
                        await tx.skillRequirementItem.createMany({
                            data: itemCosts,
                        });
                    }
                }
            }
            // ----------------------------------------------------
            // SKILL UNITS
            // ----------------------------------------------------
            for (const skill of parsed.skills) {
                for (const unit of skill.units) {
                    const createdUnit = await tx.skillUnit.create({
                        data: {
                            skillId: skill.id,
                            unitId: unit.unitId,
                            alternateId: unit.alternateId,
                            layout: unit.layout,
                            range: unit.range,
                            interval: unit.interval,
                            target: unit.target,
                            flags: unit.flags,
                            status: unit.status,
                        },
                    });
                    // ----------------------------------------------
                    // UNIT LEVELS
                    // ----------------------------------------------
                    if (unit.levels.length > 0) {
                        await tx.skillUnitLevel.createMany({
                            data: unit.levels.map((level) => ({
                                skillUnitId: createdUnit.id,
                                level: level.level,
                                layout: level.layout,
                                range: level.range,
                            })),
                        });
                    }
                }
            }
        }, {
            timeout: 120000,
        });
        // --------------------------------------------------------
        // DATA IMPORT TRACKING
        // --------------------------------------------------------
        await prisma.dataImport.create({
            data: {
                dataset: DATASET,
                source: SOURCE,
                sourceVersion: SOURCE_VERSION,
                recordsCreated,
                recordsUpdated,
                recordsDeleted,
                success: true,
            },
        });
        console.log("");
        console.log("==============================================");
        console.log("Skill DB import completed successfully");
        console.log("==============================================");
        console.log(`Skills:                ${parsed.skills.length}`);
        console.log(`Skill levels:          ${expectedLevels}`);
        console.log(`Requirements:          ${expectedRequirements}`);
        console.log(`Requirement items:     ${expectedRequirementItems}`);
        console.log(`Skill units:           ${expectedUnits}`);
        console.log(`Unit levels:           ${expectedUnitLevels}`);
        console.log(`Records created:       ${recordsCreated}`);
        console.log(`Records updated:       ${recordsUpdated}`);
        console.log(`Records deleted:       ${recordsDeleted}`);
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
        console.error("Skill DB import FAILED");
        console.error("==============================================");
        console.error(errorMessage);
        console.error("==============================================");
        throw error;
    }
}
// ------------------------------------------------------------
// ENTRY POINT
// ------------------------------------------------------------
if (require.main === module) {
    importSkillData()
        .catch(() => {
        process.exitCode = 1;
    })
        .finally(async () => {
        await prisma.$disconnect();
    });
}
export { importSkillData };
