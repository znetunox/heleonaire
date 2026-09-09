import { resolveYaml } from "../importResolver";
import { normalizeJobName } from "../jobName";
/**
 * Convert the raw Inherit field from rAthena into a normalized
 * list of job names.
 *
 * rAthena format:
 *
 * Inherit:
 *   Novice: true
 *   Swordman: true
 *
 * We only consider entries whose value is truthy.
 */
function parseInheritance(value) {
    if (!value || typeof value !== "object") {
        return [];
    }
    const inherit = value;
    const result = [];
    for (const [jobName, enabled] of Object.entries(inherit)) {
        if (!enabled) {
            continue;
        }
        result.push(normalizeJobName(jobName));
    }
    return result;
}
/**
 * Parse rAthena skill_tree.yml.
 *
 * Important:
 *
 * This parser does NOT attempt to determine:
 *
 *   parentId
 *   baseJobId
 *   jobLevel
 *
 * It only reads the skill-tree inheritance defined by rAthena.
 */
export function parseSkillTreeDefinitions() {
    console.log("[rAthena] Reading skill_tree.yml...");
    const resolved = resolveYaml("skill_tree.yml");
    console.log(`[rAthena] skill_tree.yml source: ${resolved.source}`);
    const body = Array.isArray(resolved.data?.Body)
        ? resolved.data.Body
        : [];
    console.log(`[rAthena] skill_tree.yml entries: ${body.length}`);
    const jobs = [];
    for (const rawEntry of body) {
        if (!rawEntry ||
            typeof rawEntry !== "object") {
            continue;
        }
        const entry = rawEntry;
        if (typeof entry.Job !== "string" ||
            entry.Job.trim().length === 0) {
            console.warn("[rAthena] skill_tree entry without Job");
            continue;
        }
        const job = normalizeJobName(entry.Job);
        const inherits = parseInheritance(entry.Inherit);
        jobs.push({
            job,
            inherits,
        });
    }
    return jobs;
}
/**
 * Parse and validate skill-tree jobs.
 */
export function parseSkillTree() {
    const parsed = parseSkillTreeDefinitions();
    const uniqueJobs = new Map();
    let duplicates = 0;
    for (const job of parsed) {
        if (uniqueJobs.has(job.job)) {
            duplicates++;
            console.warn(`[rAthena] Duplicate skill tree job: ${job.job}`);
            continue;
        }
        uniqueJobs.set(job.job, job);
    }
    const jobs = Array.from(uniqueJobs.values());
    console.log(`[rAthena] skill_tree jobs parsed: ${jobs.length}`);
    console.log(`[rAthena] skill_tree duplicates: ${duplicates}`);
    return {
        jobs,
        duplicates,
    };
}
