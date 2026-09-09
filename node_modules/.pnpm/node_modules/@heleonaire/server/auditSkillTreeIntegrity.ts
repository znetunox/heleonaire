import prisma from "./src/db/prisma";
import {
    parseSkillTree,
    resolveEffectiveSkillTree,
} from "./src/data/rathena/parsers/skillTreeParser";
import { resolveYaml } from "./src/data/rathena/importResolver";

const PLAYABLE_JOBS = [
    "SWORDMAN",
    "MAGE",
    "ARCHER",
    "ACOLYTE",
    "THIEF",
    "KNIGHT",
    "PRIEST",
    "WIZARD",
    "HUNTER",
    "ASSASSIN",
    "LORD_KNIGHT",
    "HIGH_PRIEST",
    "HIGH_WIZARD",
    "SNIPER",
    "ASSASSIN_CROSS",
    "RUNE_KNIGHT",
    "WARLOCK",
    "RANGER",
    "ARCH_BISHOP",
    "GUILLOTINE_CROSS",
    "DRAGON_KNIGHT",
    "SHADOW_CROSS",
    "ARCH_MAGE",
    "CARDINAL",
    "WINDHAWK",
];

async function main() {
    console.log("\n========================================");
    console.log("rAthena Skill Tree ↔ Prisma Audit");
    console.log("========================================\n");

    // ------------------------------------------------------------
    // 1. Carrega o skill_tree.yml pelo mesmo resolver do importer
    // ------------------------------------------------------------

    const resolved = resolveYaml("skill_tree.yml");

    console.log(`Fonte: ${resolved.source}`);
    console.log(`Arquivo: ${resolved.path}\n`);

    const parsed = parseSkillTree(resolved.data);

    // ------------------------------------------------------------
    // 2. Resolve exatamente como o importer
    // ------------------------------------------------------------

    const effectiveTrees = new Map<
    string,
    ReturnType<typeof resolveEffectiveSkillTree>
>();

for (const jobName of PLAYABLE_JOBS) {
    const tree = resolveEffectiveSkillTree(
        jobName,
        parsed.jobs,
    );

    effectiveTrees.set(jobName, tree);
}

const expectedSkills = [];

for (const jobName of PLAYABLE_JOBS) {
    const tree = effectiveTrees.get(jobName)!;

    for (const skill of tree) {
        expectedSkills.push({
            className: jobName,
            skillName: skill.name,
            maxLevel: skill.maxLevel,
            jobLevel: skill.jobLevel ?? 0,
            prerequisites: skill.requires.map(req => ({
                skillName: req.name,
                level: req.level,
            })),
        });
    }
}

    // ------------------------------------------------------------
    // 3. Carrega Prisma
    // ------------------------------------------------------------

    const dbRows = await prisma.classSkill.findMany({
        where: {
            class: {
                aegisName: {
                    in: PLAYABLE_JOBS,
                },
            },
        },
        select: {
            classId: true,
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

            prerequisites: {
                select: {
                    requiredLevel: true,
                    requiredSkill: {
                        select: {
                            aegisName: true,
                        },
                    },
                },
            },
        },
    });

    // ------------------------------------------------------------
    // 4. Índices
    // ------------------------------------------------------------

    const expectedMap = new Map<string, typeof expectedSkills[number]>();

    for (const row of expectedSkills) {
        expectedMap.set(
            `${row.className}:${row.skillName}`,
            row
        );
    }

    const dbMap = new Map<string, typeof dbRows[number]>();

    for (const row of dbRows) {
        dbMap.set(
            `${row.class.aegisName}:${row.skill.aegisName}`,
            row
        );
    }

    // ------------------------------------------------------------
    // 5. Contadores
    // ------------------------------------------------------------

    let missingSkills = 0;
    let extraSkills = 0;
    let maxLevelDiff = 0;
    let jobLevelDiff = 0;
    let missingPrerequisites = 0;
    let extraPrerequisites = 0;

    const problems: string[] = [];

    // ------------------------------------------------------------
    // 6. Skills esperadas → banco
    // ------------------------------------------------------------

    for (const [key, expected] of expectedMap) {
        const actual = dbMap.get(key);

        if (!actual) {
            missingSkills++;

            if (problems.length < 50) {
                problems.push(
                    `MISSING SKILL: ${key}`
                );
            }

            continue;
        }

        if (actual.maxLevel !== expected.maxLevel) {
            maxLevelDiff++;

            if (problems.length < 50) {
                problems.push(
                    `MAXLEVEL: ${key} expected=${expected.maxLevel} actual=${actual.maxLevel}`
                );
            }
        }

        if (actual.requiredJobLevel !== expected.jobLevel) {
            jobLevelDiff++;

            if (problems.length < 50) {
                problems.push(
                    `JOBLEVEL: ${key} expected=${expected.jobLevel} actual=${actual.requiredJobLevel}`
                );
            }
        }

        // --------------------------------------------------------
        // Prerequisites
        // --------------------------------------------------------

        const expectedPrereqs = expected.prerequisites
            .map(req => `${req.skillName}:${req.level}`)
            .sort();

        const actualPrereqs = actual.prerequisites
            .map(req =>
                `${req.requiredSkill.aegisName}:${req.requiredLevel}`
            )
            .sort();

        const expectedCounts = new Map<string, number>();
        const actualCounts = new Map<string, number>();

        for (const req of expectedPrereqs) {
            expectedCounts.set(
                req,
                (expectedCounts.get(req) ?? 0) + 1
            );
        }

        for (const req of actualPrereqs) {
            actualCounts.set(
                req,
                (actualCounts.get(req) ?? 0) + 1
            );
        }

        for (const [req, count] of expectedCounts) {
            const actualCount = actualCounts.get(req) ?? 0;

            if (actualCount < count) {
                missingPrerequisites += count - actualCount;

                if (problems.length < 50) {
                    problems.push(
                        `MISSING REQ: ${key} -> ${req}`
                    );
                }
            }
        }

        for (const [req, count] of actualCounts) {
            const expectedCount = expectedCounts.get(req) ?? 0;

            if (expectedCount < count) {
                extraPrerequisites += count - expectedCount;

                if (problems.length < 50) {
                    problems.push(
                        `EXTRA REQ: ${key} -> ${req}`
                    );
                }
            }
        }
    }

    // ------------------------------------------------------------
    // 7. Skills extras no banco
    // ------------------------------------------------------------

    for (const key of dbMap.keys()) {
        if (!expectedMap.has(key)) {
            extraSkills++;

            if (problems.length < 50) {
                problems.push(
                    `EXTRA SKILL: ${key}`
                );
            }
        }
    }

    // ------------------------------------------------------------
    // 8. Totais
    // ------------------------------------------------------------

    const expectedPrerequisiteCount = expectedSkills.reduce(
        (total, skill) =>
            total + skill.prerequisites.length,
        0
    );

    const actualPrerequisiteCount = dbRows.reduce(
        (total, row) =>
            total + row.prerequisites.length,
        0
    );

    console.log("----------------------------------------");
    console.log(`Classes auditadas:       ${PLAYABLE_JOBS.length}`);
    console.log(`Skills esperadas:        ${expectedSkills.length}`);
    console.log(`Skills no banco:         ${dbRows.length}`);
    console.log("");
    console.log(`Prerequisites esperados: ${expectedPrerequisiteCount}`);
    console.log(`Prerequisites no banco:  ${actualPrerequisiteCount}`);
    console.log("----------------------------------------");
    console.log(`Missing skills:          ${missingSkills}`);
    console.log(`Extra skills:            ${extraSkills}`);
    console.log(`MaxLevel divergences:    ${maxLevelDiff}`);
    console.log(`JobLevel divergences:    ${jobLevelDiff}`);
    console.log(`Missing prerequisites:   ${missingPrerequisites}`);
    console.log(`Extra prerequisites:     ${extraPrerequisites}`);
    console.log("----------------------------------------");

    const passed =
        missingSkills === 0 &&
        extraSkills === 0 &&
        maxLevelDiff === 0 &&
        jobLevelDiff === 0 &&
        missingPrerequisites === 0 &&
        extraPrerequisites === 0;

    console.log(
        `\nRESULT: ${passed ? "PASS" : "FAIL"}`
    );

    if (!passed) {
        console.log("\nPrimeiros problemas encontrados:");

        for (const problem of problems) {
            console.log(`- ${problem}`);
        }

        if (problems.length >= 50) {
            console.log("\n(Exibição limitada aos primeiros 50 problemas.)");
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });