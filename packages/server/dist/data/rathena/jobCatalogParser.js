import { parseJobs } from "./parsers/jobParser";
import { parseJobStats } from "./parsers/jobStatsParser";
import { parseSkillTree } from "./parsers/skillTreeParser";
import { normalizeJobName } from "./jobName";
const HELEONAIRE_CLASSES = [
    "knight",
    "assassin",
    "archer",
    "mage",
    "cleric",
];
/**
 * Progressão oficial do personagem dentro do Heleonaire.
 *
 * Esta árvore é uma camada de design do jogo.
 *
 * NÃO representa diretamente a hierarquia interna do rAthena.
 * O skill_tree.yml possui sua própria lógica de herança.
 */
const HELEONAIRE_PROGRESSION = [
    // ============================================================
    // KNIGHT
    // ============================================================
    {
        job: "SWORDMAN",
        heleonaireClass: "knight",
        tier: 0,
    },
    {
        job: "KNIGHT",
        heleonaireClass: "knight",
        tier: 1,
        parentJob: "SWORDMAN",
    },
    {
        job: "LORD_KNIGHT",
        heleonaireClass: "knight",
        tier: 2,
        parentJob: "KNIGHT",
    },
    {
        job: "RUNE_KNIGHT",
        heleonaireClass: "knight",
        tier: 2,
        parentJob: "KNIGHT",
    },
    {
        job: "DRAGON_KNIGHT",
        heleonaireClass: "knight",
        tier: 3,
        parentJob: "RUNE_KNIGHT",
    },
    // ============================================================
    // ASSASSIN
    // ============================================================
    {
        job: "THIEF",
        heleonaireClass: "assassin",
        tier: 0,
    },
    {
        job: "ASSASSIN",
        heleonaireClass: "assassin",
        tier: 1,
        parentJob: "THIEF",
    },
    {
        job: "ASSASSIN_CROSS",
        heleonaireClass: "assassin",
        tier: 2,
        parentJob: "ASSASSIN",
    },
    {
        job: "GUILLOTINE_CROSS",
        heleonaireClass: "assassin",
        tier: 2,
        parentJob: "ASSASSIN",
    },
    {
        job: "SHADOW_CROSS",
        heleonaireClass: "assassin",
        tier: 3,
        parentJob: "GUILLOTINE_CROSS",
    },
    // ============================================================
    // ARCHER
    // ============================================================
    {
        job: "ARCHER",
        heleonaireClass: "archer",
        tier: 0,
    },
    {
        job: "HUNTER",
        heleonaireClass: "archer",
        tier: 1,
        parentJob: "ARCHER",
    },
    {
        job: "SNIPER",
        heleonaireClass: "archer",
        tier: 2,
        parentJob: "HUNTER",
    },
    {
        job: "RANGER",
        heleonaireClass: "archer",
        tier: 2,
        parentJob: "HUNTER",
    },
    {
        job: "WINDHAWK",
        heleonaireClass: "archer",
        tier: 3,
        parentJob: "RANGER",
    },
    // ============================================================
    // MAGE
    // ============================================================
    {
        job: "MAGE",
        heleonaireClass: "mage",
        tier: 0,
    },
    {
        job: "WIZARD",
        heleonaireClass: "mage",
        tier: 1,
        parentJob: "MAGE",
    },
    {
        job: "HIGH_WIZARD",
        heleonaireClass: "mage",
        tier: 2,
        parentJob: "WIZARD",
    },
    {
        job: "WARLOCK",
        heleonaireClass: "mage",
        tier: 2,
        parentJob: "WIZARD",
    },
    {
        job: "ARCH_MAGE",
        heleonaireClass: "mage",
        tier: 3,
        parentJob: "WARLOCK",
    },
    // ============================================================
    // CLERIC
    // ============================================================
    {
        job: "ACOLYTE",
        heleonaireClass: "cleric",
        tier: 0,
    },
    {
        job: "PRIEST",
        heleonaireClass: "cleric",
        tier: 1,
        parentJob: "ACOLYTE",
    },
    {
        job: "HIGH_PRIEST",
        heleonaireClass: "cleric",
        tier: 2,
        parentJob: "PRIEST",
    },
    {
        job: "ARCH_BISHOP",
        heleonaireClass: "cleric",
        tier: 2,
        parentJob: "PRIEST",
    },
    {
        job: "CARDINAL",
        heleonaireClass: "cleric",
        tier: 3,
        parentJob: "ARCH_BISHOP",
    },
];
/**
 * Jobs técnicos/especiais que não devem entrar
 * na progressão normal de personagens.
 *
 * Eles continuam existindo no catálogo de rAthena,
 * mas não são classes jogáveis do Heleonaire.
 */
const NON_PLAYABLE_JOB_NAMES = new Set([
    "NOVICE",
    "WEDDING",
    "XMAS",
    "SUMMER",
    "HANBOK",
    "OKTOBERFEST",
    "SUMMER2",
    "MAX_BASIC",
    "GANGSI",
    "DEATH_KNIGHT",
    "DARK_COLLECTOR",
    "SECOND_JOB_START",
    "RUNE_KNIGHT_2ND",
    "MECHANIC_2ND",
    "GUILLOTINE_CROSS_2ND",
    "WARLOCK_2ND",
    "ARCHBISHOP_2ND",
    "RANGER_2ND",
    "ROYAL_GUARD_2ND",
    "GENETIC_2ND",
    "SHADOW_CHASER_2ND",
    "SORCERER_2ND",
    "SURA_2ND",
    "MINSTREL_2ND",
    "WANDERER_2ND",
    "SECOND_JOB_END",
    "MAX",
]);
function buildMmoJobMap() {
    const parsed = parseJobs();
    const map = new Map();
    for (const entry of parsed.jobs) {
        const job = normalizeJobName(entry.aegisName);
        if (map.has(job)) {
            continue;
        }
        map.set(job, {
            id: entry.id,
            job,
        });
    }
    return map;
}
function buildStatsGroupMap() {
    const parsed = parseJobStats();
    const map = new Map();
    parsed.groups.forEach((group, index) => {
        const groupNumber = index + 1;
        for (const rawJob of group.jobs) {
            const job = normalizeJobName(rawJob);
            if (!map.has(job)) {
                map.set(job, groupNumber);
            }
        }
    });
    return map;
}
function buildSkillTreeMap() {
    const parsed = parseSkillTree();
    const map = new Map();
    for (const entry of parsed.jobs) {
        const job = normalizeJobName(entry.job);
        map.set(job, entry.inherits.map(normalizeJobName));
    }
    return map;
}
function buildProgressionMap() {
    const map = new Map();
    for (const entry of HELEONAIRE_PROGRESSION) {
        const job = normalizeJobName(entry.job);
        if (map.has(job)) {
            throw new Error(`[JobCatalog] Duplicate progression job: ${job}`);
        }
        map.set(job, {
            ...entry,
            job,
            parentJob: entry.parentJob
                ? normalizeJobName(entry.parentJob)
                : undefined,
        });
    }
    return map;
}
function validateProgression(progression, mmoJobs) {
    const invalidParents = [];
    for (const entry of progression.values()) {
        if (!entry.parentJob) {
            continue;
        }
        if (!progression.has(entry.parentJob)) {
            invalidParents.push(`${entry.job} -> ${entry.parentJob} (parent not in Heleonaire progression)`);
            continue;
        }
        if (!mmoJobs.has(entry.parentJob)) {
            invalidParents.push(`${entry.job} -> ${entry.parentJob} (parent not in mmo.hpp)`);
        }
    }
    return invalidParents;
}
export function parseJobCatalog() {
    console.log("[JobCatalog] Building Heleonaire job catalog...");
    const mmoJobs = buildMmoJobMap();
    const statsGroups = buildStatsGroupMap();
    const skillTree = buildSkillTreeMap();
    const progression = buildProgressionMap();
    const missingFromMmo = [];
    const missingStats = [];
    const missingSkillTree = [];
    const duplicateJobs = [];
    const jobs = [];
    for (const config of progression.values()) {
        const job = config.job;
        const mmoJob = mmoJobs.get(job);
        if (!mmoJob) {
            missingFromMmo.push(job);
            continue;
        }
        const statsGroup = statsGroups.get(job);
        if (statsGroup === undefined) {
            missingStats.push(job);
            continue;
        }
        const skillInheritance = skillTree.get(job);
        if (!skillInheritance) {
            missingSkillTree.push(job);
            continue;
        }
        jobs.push({
            id: mmoJob.id,
            job,
            statsGroup,
            skillInheritance,
            parentJob: config.parentJob,
            heleonaireClass: config.heleonaireClass,
            tier: config.tier,
            playable: true,
        });
    }
    const invalidParents = validateProgression(progression, mmoJobs);
    const playableJobs = jobs
        .filter((job) => job.playable)
        .map((job) => job.job);
    const branches = HELEONAIRE_CLASSES.map((heleonaireClass) => ({
        heleonaireClass,
        jobs: jobs
            .filter((job) => job.heleonaireClass === heleonaireClass)
            .sort((a, b) => {
            const tierA = a.tier ?? 0;
            const tierB = b.tier ?? 0;
            if (tierA !== tierB) {
                return tierA - tierB;
            }
            return a.id - b.id;
        })
            .map((job) => job.job),
    }));
    console.log(`[JobCatalog] mmo.hpp jobs: ${mmoJobs.size}`);
    console.log(`[JobCatalog] Heleonaire progression jobs: ${progression.size}`);
    console.log(`[JobCatalog] Catalog entries: ${jobs.length}`);
    console.log(`[JobCatalog] Missing from mmo.hpp: ${missingFromMmo.length}`);
    console.log(`[JobCatalog] Missing stats: ${missingStats.length}`);
    console.log(`[JobCatalog] Missing skill tree: ${missingSkillTree.length}`);
    console.log(`[JobCatalog] Invalid parents: ${invalidParents.length}`);
    return {
        jobs,
        branches,
        missingFromMmo,
        missingStats,
        missingSkillTree,
        invalidParents,
        duplicateJobs,
        playableJobs,
    };
}
export function getHeleonaireProgression() {
    return HELEONAIRE_CLASSES.map((heleonaireClass) => ({
        heleonaireClass,
        jobs: HELEONAIRE_PROGRESSION
            .filter((entry) => entry.heleonaireClass === heleonaireClass)
            .sort((a, b) => a.tier - b.tier)
            .map((entry) => normalizeJobName(entry.job)),
    }));
}
export function isPlayableJob(jobName) {
    const job = normalizeJobName(jobName);
    return HELEONAIRE_PROGRESSION.some((entry) => normalizeJobName(entry.job) === job);
}
