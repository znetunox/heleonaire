import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
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
] as const;

const EXPECTED_CLASS_SKILLS = 993;
const EXPECTED_PREREQUISITES = 927;

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function section(title: string): void {
    console.log("");
    console.log("==============================================");
    console.log(title);
    console.log("==============================================");
}

function ok(message: string): void {
    console.log(`OK: ${message}`);
}

function fail(message: string): void {
    console.error(`FAIL: ${message}`);
}

function warn(message: string): void {
    console.warn(`WARNING: ${message}`);
}

/**
 * ============================================================
 * AUDIT
 * ============================================================
 */

async function runAudit(): Promise<void> {
    let failures = 0;
    let warnings = 0;

    console.log("");
    console.log("==============================================");
    console.log("Skill Tree Database Audit");
    console.log("==============================================");

    /**
     * ========================================================
     * 1. DATABASE COUNTS
     * ========================================================
     */

    section("Global counts");

    const totalClassSkills =
        await prisma.classSkill.count();

    const totalPrerequisites =
        await prisma.classSkillPrerequisite.count();

    console.log(
        `ClassSkill records:              ${totalClassSkills}`,
    );

    console.log(
        `ClassSkillPrerequisite records:  ${totalPrerequisites}`,
    );

    if (
        totalClassSkills !==
        EXPECTED_CLASS_SKILLS
    ) {
        fail(
            `Expected ${EXPECTED_CLASS_SKILLS} ClassSkill records, found ${totalClassSkills}.`,
        );

        failures++;
    } else {
        ok(
            `ClassSkill count is ${EXPECTED_CLASS_SKILLS}.`,
        );
    }

    if (
        totalPrerequisites !==
        EXPECTED_PREREQUISITES
    ) {
        fail(
            `Expected ${EXPECTED_PREREQUISITES} prerequisite records, found ${totalPrerequisites}.`,
        );

        failures++;
    } else {
        ok(
            `Prerequisite count is ${EXPECTED_PREREQUISITES}.`,
        );
    }

    /**
     * ========================================================
     * 2. PLAYABLE CLASS COVERAGE
     * ========================================================
     */

    section("Playable class coverage");

    const classes =
        await prisma.gameClass.findMany({
            where: {
                aegisName: {
                    in: [...HELEONAIRE_JOBS],
                },
            },
            select: {
                id: true,
                aegisName: true,
            },
            orderBy: {
                id: "asc",
            },
        });

    const classMap =
        new Map<string, number>();

    for (const gameClass of classes) {
        classMap.set(
            gameClass.aegisName.toUpperCase(),
            gameClass.id,
        );
    }

    console.log(
        `Expected playable classes: ${HELEONAIRE_JOBS.length}`,
    );

    console.log(
        `Found playable classes:    ${classes.length}`,
    );

    const missingClasses =
        HELEONAIRE_JOBS.filter(
            (jobName) =>
                !classMap.has(jobName),
        );

    if (missingClasses.length > 0) {
        fail(
            `Missing GameClass records: ${missingClasses.join(", ")}`,
        );

        failures++;
    } else {
        ok(
            "All 25 playable GameClass records exist.",
        );
    }

    /**
     * ========================================================
     * 3. CLASS SKILL COUNTS
     * ========================================================
     */

    section("ClassSkill counts by class");

    const classSkillCounts =
        await prisma.classSkill.groupBy({
            by: ["classId"],
            _count: {
                _all: true,
            },
        });

    const classSkillCountMap =
        new Map<number, number>();

    for (const row of classSkillCounts) {
        classSkillCountMap.set(
            row.classId,
            row._count._all,
        );
    }

    let calculatedClassSkillTotal = 0;

    for (const jobName of HELEONAIRE_JOBS) {
        const classId =
            classMap.get(jobName);

        if (classId === undefined) {
            continue;
        }

        const count =
            classSkillCountMap.get(
                classId,
            ) ?? 0;

        calculatedClassSkillTotal += count;

        console.log(
            `${jobName.padEnd(20)} ${count}`,
        );

        if (count === 0) {
            fail(
                `${jobName} has no ClassSkill records.`,
            );

            failures++;
        }
    }

    if (
        calculatedClassSkillTotal !==
        EXPECTED_CLASS_SKILLS
    ) {
        fail(
            `Playable class total is ${calculatedClassSkillTotal}, expected ${EXPECTED_CLASS_SKILLS}.`,
        );

        failures++;
    } else {
        ok(
            `Playable classes contain exactly ${EXPECTED_CLASS_SKILLS} ClassSkill records.`,
        );
    }

    /**
     * ========================================================
     * 4. DUPLICATE CLASS SKILLS
     * ========================================================
     */

    section("Duplicate ClassSkill audit");

    const duplicateClassSkills =
        await prisma.$queryRaw<
            Array<{
                classId: number;
                skillId: number;
                count: number;
            }>
        >`
            SELECT
                classId,
                skillId,
                COUNT(*) as count
            FROM class_skills
            GROUP BY classId, skillId
            HAVING COUNT(*) > 1
        `;

    if (duplicateClassSkills.length > 0) {
        fail(
            `Found ${duplicateClassSkills.length} duplicate ClassSkill pair(s).`,
        );

        for (
            const duplicate
            of duplicateClassSkills
        ) {
            console.log(
                `  classId=${duplicate.classId} skillId=${duplicate.skillId} count=${duplicate.count}`,
            );
        }

        failures++;
    } else {
        ok(
            "No duplicate (classId, skillId) pairs.",
        );
    }

    /**
     * ========================================================
     * 5. ORPHAN CLASS SKILLS
     * ========================================================
     */

    section("ClassSkill relation audit");

    const allClassSkills =
        await prisma.classSkill.findMany({
            select: {
                id: true,
                classId: true,
                skillId: true,
                maxLevel: true,
                requiredJobLevel: true,

                class: {
                    select: {
                        aegisName: true,
                    },
                },

                skill: {
                    select: {
                        aegisName: true,
                    },
                },
            },
        });

    let orphanClassSkills = 0;
    let invalidMaxLevels = 0;
    let invalidJobLevels = 0;

    for (const classSkill of allClassSkills) {
        if (!classSkill.class) {
            orphanClassSkills++;
        }

        if (!classSkill.skill) {
            orphanClassSkills++;
        }

        if (classSkill.maxLevel <= 0) {
            invalidMaxLevels++;

            console.log(
                `Invalid MaxLevel: ${classSkill.class?.aegisName ?? classSkill.classId} -> ${classSkill.skill?.aegisName ?? classSkill.skillId} = ${classSkill.maxLevel}`,
            );
        }

        if (classSkill.requiredJobLevel < 0) {
            invalidJobLevels++;

            console.log(
                `Invalid JobLevel: ${classSkill.class?.aegisName ?? classSkill.classId} -> ${classSkill.skill?.aegisName ?? classSkill.skillId} = ${classSkill.requiredJobLevel}`,
            );
        }
    }

    if (orphanClassSkills > 0) {
        fail(
            `Found ${orphanClassSkills} orphan ClassSkill relation(s).`,
        );

        failures++;
    } else {
        ok(
            "All ClassSkill records reference valid GameClass and Skill records.",
        );
    }

    if (invalidMaxLevels > 0) {
        fail(
            `Found ${invalidMaxLevels} ClassSkill records with invalid MaxLevel.`,
        );

        failures++;
    } else {
        ok(
            "All ClassSkill MaxLevel values are valid.",
        );
    }

    if (invalidJobLevels > 0) {
        fail(
            `Found ${invalidJobLevels} ClassSkill records with invalid requiredJobLevel.`,
        );

        failures++;
    } else {
        ok(
            "All ClassSkill requiredJobLevel values are valid.",
        );
    }

    /**
     * ========================================================
     * 6. ORPHAN PREREQUISITES
     * ========================================================
     */

    section(
        "ClassSkillPrerequisite relation audit",
    );

    const prerequisites =
        await prisma.classSkillPrerequisite.findMany(
            {
                select: {
                    id: true,
                    classSkillId: true,
                    requiredSkillId: true,
                    requiredLevel: true,

                    classSkill: {
                        select: {
                            id: true,
                            classId: true,
                            skillId: true,

                            class: {
                                select: {
                                    aegisName: true,
                                },
                            },

                            skill: {
                                select: {
                                    aegisName: true,
                                },
                            },
                        },
                    },

                    requiredSkill: {
                        select: {
                            id: true,
                            aegisName: true,
                        },
                    },
                },
            },
        );

    let orphanPrerequisites = 0;
    let invalidPrerequisiteLevels = 0;

    for (const prerequisite of prerequisites) {
        if (!prerequisite.classSkill) {
            orphanPrerequisites++;
        }

        if (!prerequisite.requiredSkill) {
            orphanPrerequisites++;
        }

        if (
            prerequisite.requiredLevel <= 0
        ) {
            invalidPrerequisiteLevels++;

            console.log(
                [
                    `Invalid prerequisite level:`,
                    `classSkillId=${prerequisite.classSkillId}`,
                    `requiredSkillId=${prerequisite.requiredSkillId}`,
                    `level=${prerequisite.requiredLevel}`,
                ].join(" "),
            );
        }
    }

    if (orphanPrerequisites > 0) {
        fail(
            `Found ${orphanPrerequisites} orphan prerequisite relation(s).`,
        );

        failures++;
    } else {
        ok(
            "All prerequisites reference valid ClassSkill and Skill records.",
        );
    }

    if (invalidPrerequisiteLevels > 0) {
        fail(
            `Found ${invalidPrerequisiteLevels} prerequisites with invalid requiredLevel.`,
        );

        failures++;
    } else {
        ok(
            "All prerequisite levels are valid.",
        );
    }

    /**
     * ========================================================
     * 7. DUPLICATE PREREQUISITES
     * ========================================================
     */

    section(
        "Duplicate prerequisite audit",
    );

    const duplicatePrerequisites =
        await prisma.$queryRaw<
            Array<{
                classSkillId: string;
                requiredSkillId: number;
                count: number;
            }>
        >`
            SELECT
                classSkillId,
                requiredSkillId,
                COUNT(*) as count
            FROM class_skill_prerequisites
            GROUP BY classSkillId, requiredSkillId
            HAVING COUNT(*) > 1
        `;

    if (
        duplicatePrerequisites.length > 0
    ) {
        fail(
            `Found ${duplicatePrerequisites.length} duplicate prerequisite pair(s).`,
        );

        for (
            const duplicate
            of duplicatePrerequisites
        ) {
            console.log(
                `  classSkillId=${duplicate.classSkillId} requiredSkillId=${duplicate.requiredSkillId} count=${duplicate.count}`,
            );
        }

        failures++;
    } else {
        ok(
            "No duplicate (classSkillId, requiredSkillId) pairs.",
        );
    }

    /**
     * ========================================================
     * 8. MG_SAFETYWALL CLASS-SPECIFIC TEST
     * ========================================================
     *
     * This is the most important regression test.
     *
     * MG_SAFETYWALL exists in multiple job trees with
     * different prerequisites.
     * ========================================================
     */

    section(
        "MG_SAFETYWALL class-specific prerequisite audit",
    );

    const safetyWall =
        await prisma.skill.findUnique({
            where: {
                aegisName:
                    "MG_SAFETYWALL",
            },
            select: {
                id: true,
                aegisName: true,
            },
        });

    if (!safetyWall) {
        fail(
            "MG_SAFETYWALL does not exist in Skill table.",
        );

        failures++;
    } else {
        const safetyWallClassSkills =
            await prisma.classSkill.findMany({
                where: {
                    skillId: safetyWall.id,
                    class: {
                        aegisName: {
                            in: [
                                "MAGE",
                                "WIZARD",
                                "HIGH_WIZARD",
                                "WARLOCK",
                                "ARCH_MAGE",
                                "PRIEST",
                                "HIGH_PRIEST",
                                "ARCH_BISHOP",
                                "CARDINAL",
                            ],
                        },
                    },
                },
                select: {
                    id: true,

                    class: {
                        select: {
                            aegisName: true,
                        },
                    },

                    skill: {
                        select: {
                            aegisName: true,
                        },
                    },

                    prerequisites: {
                        select: {
                            requiredLevel: true,

                            requiredSkill: {
                                select: {
                                    aegisName: true,
                                },
                            },
                        },
                        orderBy: {
                            requiredSkillId:
                                "asc",
                        },
                    },
                },
            });

        const expectedMage =
            new Set([
                "MG_NAPALMBEAT:7",
                "MG_SOULSTRIKE:5",
            ]);

        const expectedPriest =
            new Set([
                "PR_ASPERSIO:4",
                "PR_SANCTUARY:3",
            ]);

        let foundMageVariants = 0;
        let foundPriestVariants = 0;

        for (
            const classSkill
            of safetyWallClassSkills
        ) {
            const job =
                classSkill.class.aegisName;

            const actual =
                new Set(
                    classSkill.prerequisites.map(
                        (requirement) =>
                            `${requirement.requiredSkill.aegisName}:${requirement.requiredLevel}`,
                    ),
                );

            console.log("");
            console.log(
                `${job} -> MG_SAFETYWALL`,
            );

            console.log(
                `  prerequisites: ${[
                    ...actual,
                ].join(", ") || "(none)"}`,
            );

            if (
                [
                    "MAGE",
                    "WIZARD",
                    "HIGH_WIZARD",
                    "WARLOCK",
                    "ARCH_MAGE",
                ].includes(job)
            ) {
                foundMageVariants++;

                if (
                    actual.size !==
                        expectedMage.size ||
                    ![
                        ...expectedMage,
                    ].every((value) =>
                        actual.has(value),
                    )
                ) {
                    fail(
                        `${job} -> MG_SAFETYWALL has incorrect prerequisites.`,
                    );

                    failures++;
                }
            }

            if (
                [
                    "PRIEST",
                    "HIGH_PRIEST",
                    "ARCH_BISHOP",
                    "CARDINAL",
                ].includes(job)
            ) {
                foundPriestVariants++;

                if (
                    actual.size !==
                        expectedPriest.size ||
                    ![
                        ...expectedPriest,
                    ].every((value) =>
                        actual.has(value),
                    )
                ) {
                    fail(
                        `${job} -> MG_SAFETYWALL has incorrect prerequisites.`,
                    );

                    failures++;
                }
            }
        }

        if (
            foundMageVariants === 5
        ) {
            ok(
                "All Mage-branch MG_SAFETYWALL variants have the correct prerequisites.",
            );
        } else {
            fail(
                `Expected 5 Mage-branch MG_SAFETYWALL variants, found ${foundMageVariants}.`,
            );

            failures++;
        }

        if (
            foundPriestVariants === 4
        ) {
            ok(
                "All Priest-branch MG_SAFETYWALL variants have the correct prerequisites.",
            );
        } else {
            fail(
                `Expected 4 Priest-branch MG_SAFETYWALL variants, found ${foundPriestVariants}.`,
            );

            failures++;
        }
    }

    /**
     * ========================================================
     * 9. LK_BERSERK JOB LEVEL TEST
     * ========================================================
     *
     * LORD_KNIGHT:
     *   JobLevel = 50
     *
     * DRAGON_KNIGHT:
     *   JobLevel = 0
     *
     * This validates that requiredJobLevel is stored on
     * ClassSkill and therefore remains class-specific.
     * ========================================================
     */

    section(
        "LK_BERSERK class-specific JobLevel audit",
    );

    const berserk =
        await prisma.skill.findUnique({
            where: {
                aegisName: "LK_BERSERK",
            },
            select: {
                id: true,
                aegisName: true,
            },
        });

    if (!berserk) {
        fail(
            "LK_BERSERK does not exist in Skill table.",
        );

        failures++;
    } else {
        const berserkClassSkills =
            await prisma.classSkill.findMany({
                where: {
                    skillId: berserk.id,
                    class: {
                        aegisName: {
                            in: [
                                "LORD_KNIGHT",
                                "DRAGON_KNIGHT",
                            ],
                        },
                    },
                },
                select: {
                    requiredJobLevel: true,

                    class: {
                        select: {
                            aegisName: true,
                        },
                    },

                    skill: {
                        select: {
                            aegisName: true,
                        },
                    },
                },
            });

        const expectedLevels =
            new Map<string, number>([
                [
                    "LORD_KNIGHT",
                    50,
                ],
                [
                    "DRAGON_KNIGHT",
                    0,
                ],
            ]);

        for (
            const classSkill
            of berserkClassSkills
        ) {
            const job =
                classSkill.class.aegisName;

            const expected =
                expectedLevels.get(job);

            console.log(
                `${job} -> LK_BERSERK: JobLevel=${classSkill.requiredJobLevel}`,
            );

            if (
                expected === undefined
            ) {
                continue;
            }

            if (
                classSkill.requiredJobLevel !==
                expected
            ) {
                fail(
                    [
                        `${job} -> LK_BERSERK`,
                        `expected JobLevel=${expected}`,
                        `found ${classSkill.requiredJobLevel}`,
                    ].join(" "),
                );

                failures++;
            }
        }

        const foundJobs =
            new Set(
                berserkClassSkills.map(
                    (entry) =>
                        entry.class
                            .aegisName,
                ),
            );

        for (
            const [job, expected]
            of expectedLevels
        ) {
            if (!foundJobs.has(job)) {
                fail(
                    `${job} -> LK_BERSERK ClassSkill is missing.`,
                );

                failures++;

                continue;
            }

            const row =
                berserkClassSkills.find(
                    (entry) =>
                        entry.class
                            .aegisName ===
                        job,
                );

            if (
                row &&
                row.requiredJobLevel ===
                    expected
            ) {
                ok(
                    `${job} -> LK_BERSERK has requiredJobLevel=${expected}.`,
                );
            }
        }
    }

    /**
     * ========================================================
     * 10. SELF-PREREQUISITE AUDIT
     * ========================================================
     */

    section(
        "Self-prerequisite audit",
    );

    const selfPrerequisites =
        await prisma.$queryRaw<
            Array<{
                classSkillId: string;
                requiredSkillId: number;
                skillId: number;
            }>
        >`
            SELECT
                csp.classSkillId,
                csp.requiredSkillId,
                cs.skillId
            FROM class_skill_prerequisites csp
            INNER JOIN class_skills cs
                ON cs.id = csp.classSkillId
            WHERE csp.requiredSkillId = cs.skillId
        `;

    if (
        selfPrerequisites.length > 0
    ) {
        warn(
            `Found ${selfPrerequisites.length} self-prerequisite relation(s).`,
        );

        warnings++;
    } else {
        ok(
            "No skill requires itself.",
        );
    }

    /**
     * ========================================================
     * 11. CLASS-SKILL PREREQUISITE CONSISTENCY
     * ========================================================
     *
     * Make sure every prerequisite belongs to the same
     * class-specific ClassSkill rather than merely pointing
     * at a global Skill.
     * ========================================================
     */

    section(
        "Class-specific prerequisite ownership audit",
    );

    const prerequisiteClassIds =
        await prisma.classSkillPrerequisite.findMany(
            {
                select: {
                    classSkill: {
                        select: {
                            classId: true,
                        },
                    },
                },
            },
        );

    const invalidOwnership =
        prerequisiteClassIds.filter(
            (entry) =>
                !entry.classSkill,
        ).length;

    if (invalidOwnership > 0) {
        fail(
            `Found ${invalidOwnership} prerequisites without ClassSkill ownership.`,
        );

        failures++;
    } else {
        ok(
            "Every prerequisite belongs to a specific ClassSkill.",
        );
    }

    /**
     * ========================================================
     * 12. DATA IMPORT HISTORY
     * ========================================================
     */

    section("DataImport audit");

    const latestImport =
    await prisma.dataImport.findFirst({
        where: {
            dataset: "skill_tree_data",
        },
        orderBy: {
            importedAt: "desc",
        },
    });

    if (!latestImport) {
        fail(
            "No skill_tree_data DataImport record found.",
        );

        failures++;
    } else {
        console.log(
            `Latest import: ${latestImport.importedAt.toISOString()}`,
        );

        console.log(
            `Success:       ${latestImport.success}`,
        );

        console.log(
            `Created:       ${latestImport.recordsCreated}`,
        );

        console.log(
            `Updated:       ${latestImport.recordsUpdated}`,
        );

        console.log(
            `Deleted:       ${latestImport.recordsDeleted}`,
        );

        if (!latestImport.success) {
            fail(
                "Latest skill_tree_data import is marked as failed.",
            );

            failures++;
        } else {
            ok(
                "Latest skill_tree_data import is successful.",
            );
        }

        if (
            latestImport.recordsCreated !==
            EXPECTED_CLASS_SKILLS +
                EXPECTED_PREREQUISITES
        ) {
            warn(
                [
                    `Latest import created ${latestImport.recordsCreated}`,
                    `records; expected ${EXPECTED_CLASS_SKILLS + EXPECTED_PREREQUISITES}.`,
                ].join(" "),
            );

            warnings++;
        }
    }

    /**
     * ========================================================
     * FINAL RESULT
     * ========================================================
     */

    section("AUDIT RESULT");

    console.log(
        `Failures: ${failures}`,
    );

    console.log(
        `Warnings: ${warnings}`,
    );

    if (failures > 0) {
        console.error("");
        console.error(
            "FAIL: Skill Tree database audit found problems.",
        );

        process.exitCode = 1;

        return;
    }

    if (warnings > 0) {
        console.warn("");
        console.warn(
            "PASS WITH WARNINGS: Skill Tree database is structurally valid.",
        );

        return;
    }

    console.log("");
    console.log(
        "PASS: Skill Tree database audit completed successfully.",
    );
}

/**
 * ============================================================
 * ENTRY POINT
 * ============================================================
 */

runAudit()
    .catch((error) => {
        console.error("");
        console.error(
            "Skill Tree database audit crashed:",
        );

        console.error(error);

        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });