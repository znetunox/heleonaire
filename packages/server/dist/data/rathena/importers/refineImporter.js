import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";
import { parseRefine, } from "../parsers/refineParser";
const prisma = new PrismaClient();
const DATASET = "refine_data";
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
function ruleKey(group, itemLevel, refineLevel) {
    return `${group}:${itemLevel}:${refineLevel}`;
}
async function resolveMaterials(rules) {
    const requiredNames = new Set();
    for (const rule of rules) {
        for (const chance of rule.chances) {
            if (chance.material.trim()) {
                requiredNames.add(chance.material);
            }
        }
    }
    if (requiredNames.size === 0) {
        return new Map();
    }
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
    for (const name of requiredNames) {
        if (!itemMap.has(normalizeName(name))) {
            missing.push(name);
        }
    }
    if (missing.length > 0) {
        const examples = missing
            .sort()
            .slice(0, 50)
            .join(", ");
        throw new Error([
            "Refine DB import aborted.",
            `Missing ${missing.length} item(s) referenced as refine materials.`,
            "The Item table must be imported before refine_data.",
            `Missing items: ${examples}`,
        ].join(" "));
    }
    const resolved = new Map();
    for (const name of requiredNames) {
        const itemId = itemMap.get(normalizeName(name));
        if (itemId === undefined) {
            throw new Error(`Failed to resolve refine material item: ${name}`);
        }
        resolved.set(name, itemId);
    }
    return resolved;
}
function validateRules(rules) {
    if (rules.length === 0) {
        throw new Error("refine.yml produced zero refine rules. Import aborted.");
    }
    const keys = new Set();
    for (const rule of rules) {
        if (!rule.group.trim()) {
            throw new Error("Refine rule has an empty Group.");
        }
        if (rule.itemLevel <= 0) {
            throw new Error([
                "Invalid refine item level:",
                rule.group,
                rule.itemLevel,
            ].join(" "));
        }
        if (rule.refineLevel <= 0) {
            throw new Error([
                "Invalid refine level:",
                rule.group,
                rule.itemLevel,
                rule.refineLevel,
            ].join(" "));
        }
        const key = ruleKey(rule.group, rule.itemLevel, rule.refineLevel);
        if (keys.has(key)) {
            throw new Error(`Duplicate refine rule detected: ${key}`);
        }
        keys.add(key);
        const chanceTypes = new Set();
        for (const chance of rule.chances) {
            if (!chance.type.trim()) {
                throw new Error(`Refine rule ${key} contains a chance without Type.`);
            }
            if (!chance.material.trim()) {
                throw new Error(`Refine rule ${key} contains a chance without Material.`);
            }
            if (chanceTypes.has(chance.type)) {
                throw new Error(`Duplicate refine chance type "${chance.type}" in rule ${key}.`);
            }
            chanceTypes.add(chance.type);
        }
    }
}
async function importRefineData() {
    console.log("[rAthena] Starting refine DB import...");
    const parsed = parseRefine();
    console.log(`[rAthena] refine.yml source: rathena`);
    console.log(`[rAthena] refine rules parsed: ${parsed.rules.length}`);
    console.log(`[rAthena] refine duplicates: ${parsed.duplicates}`);
    if (parsed.duplicates > 0) {
        throw new Error([
            `refine.yml contains ${parsed.duplicates}`,
            "duplicate refine rule(s).",
        ].join(" "));
    }
    // ----------------------------------------------------------
    // BASIC VALIDATION
    // ----------------------------------------------------------
    validateRules(parsed.rules);
    // ----------------------------------------------------------
    // RESOLVE MATERIAL ITEMS BEFORE TRANSACTION
    // ----------------------------------------------------------
    const materialMap = await resolveMaterials(parsed.rules);
    console.log(`[rAthena] refine material items resolved: ${materialMap.size}`);
    // ----------------------------------------------------------
    // EXPECTED COUNTS
    // ----------------------------------------------------------
    const expectedRules = parsed.rules.length;
    const expectedChances = parsed.rules.reduce((total, rule) => total + rule.chances.length, 0);
    console.log(`[rAthena] expected RefineRule records: ${expectedRules}`);
    console.log(`[rAthena] expected RefineChance records: ${expectedChances}`);
    // ----------------------------------------------------------
    // IMPORT
    // ----------------------------------------------------------
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsDeleted = 0;
    try {
        await prisma.$transaction(async (tx) => {
            const importedGroups = new Set(parsed.rules.map((rule) => rule.group));
            // ----------------------------------------------------
            // REMOVE STALE RULES
            //
            // Only groups present in the current rAthena dataset
            // are synchronized.
            // ----------------------------------------------------
            const existingRules = await tx.refineRule.findMany({
                where: {
                    group: {
                        in: [...importedGroups],
                    },
                },
                select: {
                    id: true,
                    group: true,
                    itemLevel: true,
                    refineLevel: true,
                },
            });
            const importedKeys = new Set(parsed.rules.map((rule) => ruleKey(rule.group, rule.itemLevel, rule.refineLevel)));
            const staleRuleIds = existingRules
                .filter((rule) => !importedKeys.has(ruleKey(rule.group, rule.itemLevel, rule.refineLevel)))
                .map((rule) => rule.id);
            if (staleRuleIds.length > 0) {
                const deleted = await tx.refineRule.deleteMany({
                    where: {
                        id: {
                            in: staleRuleIds,
                        },
                    },
                });
                recordsDeleted += deleted.count;
            }
            // ----------------------------------------------------
            // UPSERT RULES
            // ----------------------------------------------------
            for (const rule of parsed.rules) {
                const sourceHash = hash(rule);
                const existing = await tx.refineRule.findUnique({
                    where: {
                        group_itemLevel_refineLevel: {
                            group: rule.group,
                            itemLevel: rule.itemLevel,
                            refineLevel: rule.refineLevel,
                        },
                    },
                    select: {
                        id: true,
                    },
                });
                await tx.refineRule.upsert({
                    where: {
                        group_itemLevel_refineLevel: {
                            group: rule.group,
                            itemLevel: rule.itemLevel,
                            refineLevel: rule.refineLevel,
                        },
                    },
                    create: {
                        group: rule.group,
                        itemLevel: rule.itemLevel,
                        refineLevel: rule.refineLevel,
                        bonus: rule.bonus,
                        randomBonus: rule.randomBonus,
                        blacksmithBlessingAmount: rule.blacksmithBlessingAmount,
                        broadcastSuccess: rule.broadcastSuccess,
                        broadcastFailure: rule.broadcastFailure,
                        source: SOURCE,
                        sourceHash,
                    },
                    update: {
                        bonus: rule.bonus,
                        randomBonus: rule.randomBonus,
                        blacksmithBlessingAmount: rule.blacksmithBlessingAmount,
                        broadcastSuccess: rule.broadcastSuccess,
                        broadcastFailure: rule.broadcastFailure,
                        source: SOURCE,
                        sourceHash,
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
            // SYNCHRONIZE CHANCES
            // ----------------------------------------------------
            for (const rule of parsed.rules) {
                const refineRule = await tx.refineRule.findUnique({
                    where: {
                        group_itemLevel_refineLevel: {
                            group: rule.group,
                            itemLevel: rule.itemLevel,
                            refineLevel: rule.refineLevel,
                        },
                    },
                    select: {
                        id: true,
                    },
                });
                if (!refineRule) {
                    throw new Error([
                        "Failed to retrieve imported RefineRule:",
                        ruleKey(rule.group, rule.itemLevel, rule.refineLevel),
                    ].join(" "));
                }
                const importedChanceTypes = new Set(rule.chances.map((chance) => chance.type));
                const existingChances = await tx.refineChance.findMany({
                    where: {
                        refineRuleId: refineRule.id,
                    },
                    select: {
                        id: true,
                        type: true,
                    },
                });
                const staleChanceIds = existingChances
                    .filter((chance) => !importedChanceTypes.has(chance.type))
                    .map((chance) => chance.id);
                if (staleChanceIds.length > 0) {
                    const deleted = await tx.refineChance.deleteMany({
                        where: {
                            id: {
                                in: staleChanceIds,
                            },
                        },
                    });
                    recordsDeleted +=
                        deleted.count;
                }
                for (const chance of rule.chances) {
                    const materialItemId = materialMap.get(chance.material);
                    if (materialItemId ===
                        undefined) {
                        throw new Error([
                            `Could not resolve refine material`,
                            `"${chance.material}"`,
                            `for rule`,
                            `"${ruleKey(rule.group, rule.itemLevel, rule.refineLevel)}"`,
                        ].join(" "));
                    }
                    const existingChance = await tx.refineChance.findUnique({
                        where: {
                            refineRuleId_type: {
                                refineRuleId: refineRule.id,
                                type: chance.type,
                            },
                        },
                        select: {
                            id: true,
                        },
                    });
                    await tx.refineChance.upsert({
                        where: {
                            refineRuleId_type: {
                                refineRuleId: refineRule.id,
                                type: chance.type,
                            },
                        },
                        create: {
                            refineRuleId: refineRule.id,
                            type: chance.type,
                            rate: chance.rate,
                            price: chance.price,
                            materialItemId: materialItemId,
                            breakingRate: chance.breakingRate,
                            downgradeAmount: chance.downgradeAmount,
                        },
                        update: {
                            rate: chance.rate,
                            price: chance.price,
                            materialItemId: materialItemId,
                            breakingRate: chance.breakingRate,
                            downgradeAmount: chance.downgradeAmount,
                        },
                    });
                    if (existingChance) {
                        recordsUpdated++;
                    }
                    else {
                        recordsCreated++;
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
        console.log("Refine DB import completed successfully");
        console.log("==============================================");
        console.log(`Refine rules:          ${expectedRules}`);
        console.log(`Refine chances:        ${expectedChances}`);
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
        console.error("Refine DB import FAILED");
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
    importRefineData()
        .catch(() => {
        process.exitCode = 1;
    })
        .finally(async () => {
        await prisma.$disconnect();
    });
}
export { importRefineData };
