import {
    parseSkillTree,
    resolveEffectiveSkillTree,
    ParsedSkillTreeJob,
    EffectiveSkillTreeSkill,
} from "../parsers/skillTreeParser";

const HELEONAIRE_JOBS = [
    "SWORDMAN",
    "KNIGHT",
    "LORD_KNIGHT",
    "RUNE_KNIGHT",
    "DRAGON_KNIGHT",

    "THIEF",
    "ASSASSIN",
    "ASSASSIN_CROSS",
    "GUILLOTINE_CROSS",
    "SHADOW_CROSS",

    "ARCHER",
    "HUNTER",
    "SNIPER",
    "RANGER",
    "WINDHAWK",

    "MAGE",
    "WIZARD",
    "HIGH_WIZARD",
    "WARLOCK",
    "ARCH_MAGE",

    "ACOLYTE",
    "PRIEST",
    "HIGH_PRIEST",
    "ARCH_BISHOP",
    "CARDINAL",
];

interface SkillOccurrence {
    job: string;
    skill: EffectiveSkillTreeSkill;
}

function prerequisiteSignature(skill: EffectiveSkillTreeSkill): string {
    return [...skill.requires]
        .sort((a, b) => {
            const nameCompare = a.name.localeCompare(b.name);

            if (nameCompare !== 0) {
                return nameCompare;
            }

            return a.level - b.level;
        })
        .map(req => `${req.name}:${req.level}`)
        .join("|");
}

function prerequisiteDisplay(skill: EffectiveSkillTreeSkill): string {
    if (skill.requires.length === 0) {
        return "[]";
    }

    return JSON.stringify(
        [...skill.requires].sort((a, b) => {
            const nameCompare = a.name.localeCompare(b.name);

            if (nameCompare !== 0) {
                return nameCompare;
            }

            return a.level - b.level;
        }),
    );
}

async function main() {
    console.log("");
    console.log("==============================================");
    console.log("Skill Tree Model Audit");
    console.log("==============================================");

    const parsed = parseSkillTree();

    const jobMap = new Map<string, ParsedSkillTreeJob>();

    for (const job of parsed.jobs) {
        jobMap.set(job.job, job);
    }

    console.log(`Skill tree jobs parsed: ${parsed.jobs.length}`);
    console.log(`Duplicates: ${parsed.duplicates}`);
    console.log("");

    // ---------------------------------------------------------
    // Resolve effective trees
    // ---------------------------------------------------------

    const effectiveByJob = new Map<
        string,
        EffectiveSkillTreeSkill[]
    >();

    for (const jobName of HELEONAIRE_JOBS) {
        if (!jobMap.has(jobName)) {
            throw new Error(
                `Missing skill tree for Heleonaire job: ${jobName}`,
            );
        }

        const effective = resolveEffectiveSkillTree(
            jobName,
            parsed.jobs,
        );

        effectiveByJob.set(jobName, effective);
    }

    // ---------------------------------------------------------
    // ClassSkill count
    // ---------------------------------------------------------

    let totalClassSkills = 0;

    console.log("Effective skill counts:");

    for (const jobName of HELEONAIRE_JOBS) {
        const skills = effectiveByJob.get(jobName)!;

        totalClassSkills += skills.length;

        console.log(
            `  ${jobName.padEnd(20)} ${skills.length}`,
        );
    }

    console.log("");
    console.log(`Total ClassSkill rows: ${totalClassSkills}`);

    // ---------------------------------------------------------
    // Collect skill occurrences
    // ---------------------------------------------------------

    const occurrences = new Map<
        string,
        SkillOccurrence[]
    >();

    for (const jobName of HELEONAIRE_JOBS) {
        const skills = effectiveByJob.get(jobName)!;

        for (const skill of skills) {
            const list = occurrences.get(skill.name) ?? [];

            list.push({
                job: jobName,
                skill,
            });

            occurrences.set(skill.name, list);
        }
    }

    // ---------------------------------------------------------
    // Audit prerequisite consistency
    // ---------------------------------------------------------

    console.log("");
    console.log("==============================================");
    console.log("Prerequisite consistency audit");
    console.log("==============================================");

    const prerequisiteConflicts: {
        skill: string;
        variants: {
            signature: string;
            jobs: string[];
            display: string;
        }[];
    }[] = [];

    let totalPrerequisites = 0;

    for (const [skillName, list] of occurrences) {
        const variants = new Map<
            string,
            {
                jobs: string[];
                display: string;
            }
        >();

        for (const occurrence of list) {
            totalPrerequisites += occurrence.skill.requires.length;

            const signature =
                prerequisiteSignature(occurrence.skill);

            const existing = variants.get(signature);

            if (existing) {
                existing.jobs.push(occurrence.job);
            } else {
                variants.set(signature, {
                    jobs: [occurrence.job],
                    display: prerequisiteDisplay(
                        occurrence.skill,
                    ),
                });
            }
        }

        if (variants.size > 1) {
            prerequisiteConflicts.push({
                skill: skillName,
                variants: [...variants.entries()].map(
                    ([signature, data]) => ({
                        signature,
                        jobs: data.jobs,
                        display: data.display,
                    }),
                ),
            });
        }
    }

    console.log(
        `Total prerequisite entries: ${totalPrerequisites}`,
    );

    console.log(
        `Skills with conflicting prerequisites: ${prerequisiteConflicts.length}`,
    );

    if (prerequisiteConflicts.length > 0) {
        console.log("");
        console.log("!!! PREREQUISITE CONFLICTS !!!");
        console.log("");

        for (const conflict of prerequisiteConflicts) {
            console.log(`Skill: ${conflict.skill}`);

            for (const variant of conflict.variants) {
                console.log(
                    `  Jobs: ${variant.jobs.join(", ")}`,
                );

                console.log(
                    `  Requires: ${variant.display}`,
                );
            }

            console.log("");
        }
    } else {
        console.log(
            "OK: prerequisites are globally consistent.",
        );
    }

    // ---------------------------------------------------------
    // Audit duplicate pair with different levels
    // ---------------------------------------------------------

    console.log("");
    console.log("==============================================");
    console.log("Prerequisite pair audit");
    console.log("==============================================");

    const pairLevels = new Map<
        string,
        {
            skill: string;
            requiredSkill: string;
            levels: Map<number, string[]>;
        }
    >();

    for (const [skillName, list] of occurrences) {
        for (const occurrence of list) {
            for (const requirement of occurrence.skill.requires) {
                const key =
                    `${skillName} -> ${requirement.name}`;

                let pair = pairLevels.get(key);

                if (!pair) {
                    pair = {
                        skill: skillName,
                        requiredSkill: requirement.name,
                        levels: new Map(),
                    };

                    pairLevels.set(key, pair);
                }

                const jobs =
                    pair.levels.get(requirement.level) ?? [];

                jobs.push(occurrence.job);

                pair.levels.set(
                    requirement.level,
                    jobs,
                );
            }
        }
    }

    const pairConflicts = [...pairLevels.values()]
        .filter(pair => pair.levels.size > 1);

    console.log(
        `Prerequisite pairs: ${pairLevels.size}`,
    );

    console.log(
        `Pairs with conflicting levels: ${pairConflicts.length}`,
    );

    if (pairConflicts.length > 0) {
        console.log("");
        console.log("!!! LEVEL CONFLICTS !!!");
        console.log("");

        for (const pair of pairConflicts) {
            console.log(
                `${pair.skill} -> ${pair.requiredSkill}`,
            );

            for (const [level, jobs] of pair.levels) {
                console.log(
                    `  Level ${level}: ${jobs.join(", ")}`,
                );
            }

            console.log("");
        }
    } else {
        console.log(
            "OK: prerequisite pair levels are consistent.",
        );
    }

    // ---------------------------------------------------------
    // Audit BaseLevel
    // ---------------------------------------------------------

    console.log("");
    console.log("==============================================");
    console.log("BaseLevel audit");
    console.log("==============================================");

    const baseLevelVariants = new Map<
        string,
        Map<string, string[]>
    >();

    let baseLevelCount = 0;

    for (const [skillName, list] of occurrences) {
        for (const occurrence of list) {
            const baseLevel =
                occurrence.skill.baseLevel;

            if (baseLevel === undefined) {
                continue;
            }

            baseLevelCount++;

            const key =
                String(baseLevel);

            const variants =
                baseLevelVariants.get(skillName) ??
                new Map<string, string[]>();

            const jobs =
                variants.get(key) ?? [];

            jobs.push(occurrence.job);

            variants.set(key, jobs);

            baseLevelVariants.set(
                skillName,
                variants,
            );
        }
    }

    const baseLevelConflicts = [...baseLevelVariants.entries()]
        .filter(([, variants]) => variants.size > 1);

    console.log(
        `Skill occurrences with BaseLevel: ${baseLevelCount}`,
    );

    console.log(
        `Skills with conflicting BaseLevel: ${baseLevelConflicts.length}`,
    );

    if (baseLevelConflicts.length > 0) {
        console.log("");
        console.log("!!! BASE LEVEL CONFLICTS !!!");
        console.log("");

        for (const [skillName, variants] of baseLevelConflicts) {
            console.log(`Skill: ${skillName}`);

            for (const [level, jobs] of variants) {
                console.log(
                    `  BaseLevel ${level}: ${jobs.join(", ")}`,
                );
            }

            console.log("");
        }
    } else {
        console.log(
            "OK: BaseLevel is consistent wherever present.",
        );
    }

    // ---------------------------------------------------------
    // Audit JobLevel
    // ---------------------------------------------------------

    console.log("");
    console.log("==============================================");
    console.log("JobLevel audit");
    console.log("==============================================");

    const jobLevelVariants = new Map<
        string,
        Map<string, string[]>
    >();

    for (const [skillName, list] of occurrences) {
        for (const occurrence of list) {
            const jobLevel =
                occurrence.skill.jobLevel;

            if (jobLevel === undefined) {
                continue;
            }

            const key =
                String(jobLevel);

            const variants =
                jobLevelVariants.get(skillName) ??
                new Map<string, string[]>();

            const jobs =
                variants.get(key) ?? [];

            jobs.push(occurrence.job);

            variants.set(key, jobs);

            jobLevelVariants.set(
                skillName,
                variants,
            );
        }
    }

    const jobLevelConflicts = [...jobLevelVariants.entries()]
        .filter(([, variants]) => variants.size > 1);

    console.log(
        `Skills with conflicting JobLevel: ${jobLevelConflicts.length}`,
    );

    if (jobLevelConflicts.length > 0) {
        console.log("");

        for (const [skillName, variants] of jobLevelConflicts) {
            console.log(`Skill: ${skillName}`);

            for (const [level, jobs] of variants) {
                console.log(
                    `  JobLevel ${level}: ${jobs.join(", ")}`,
                );
            }

            console.log("");
        }
    } else {
        console.log(
            "OK: JobLevel is consistent wherever present.",
        );
    }

    // ---------------------------------------------------------
    // Final result
    // ---------------------------------------------------------

    console.log("");
    console.log("==============================================");
    console.log("AUDIT RESULT");
    console.log("==============================================");

    let failed = false;

    if (prerequisiteConflicts.length > 0) {
        console.log(
            "FAIL: prerequisites are class-specific.",
        );
        failed = true;
    }

    if (pairConflicts.length > 0) {
        console.log(
            "FAIL: same prerequisite pair has different levels.",
        );
        failed = true;
    }

    if (baseLevelConflicts.length > 0) {
        console.log(
            "FAIL: BaseLevel is class-specific.",
        );
        failed = true;
    }

    if (failed) {
        console.log("");
        console.log(
            "Schema changes are required before import.",
        );
        console.log("==============================================");

        process.exitCode = 1;
        return;
    }

    console.log(
        "PASS: current model can represent the effective skill trees.",
    );

    console.log("");
    console.log(
        `ClassSkill rows: ${totalClassSkills}`,
    );

    console.log(
        `Prerequisite rows: ${totalPrerequisites}`,
    );

    console.log("==============================================");
}

main().catch(error => {
    console.error("");
    console.error("AUDIT FAILED");
    console.error(error);
    process.exitCode = 1;
});