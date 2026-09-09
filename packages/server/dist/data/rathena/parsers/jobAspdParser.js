import { resolveYaml } from "../importResolver";
function toNumber(value, fallback = 0) {
    if (typeof value === "number") {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return fallback;
}
function parseJobs(jobs) {
    if (!jobs || typeof jobs !== "object") {
        return [];
    }
    return Object.entries(jobs)
        .filter(([, enabled]) => enabled === true)
        .map(([name]) => name);
}
function parseBaseASPD(value) {
    const result = new Map();
    if (!value || typeof value !== "object") {
        return result;
    }
    for (const [weaponType, rawValue,] of Object.entries(value)) {
        const aspd = toNumber(rawValue);
        if (aspd > 0) {
            result.set(weaponType, aspd);
        }
    }
    return result;
}
export function parseJobAspd() {
    console.log("[rAthena] Reading job_aspd.yml...");
    const resolved = resolveYaml("job_aspd.yml");
    const body = Array.isArray(resolved.data)
        ? resolved.data
        : resolved.data?.Body ?? [];
    const groups = [];
    for (const raw of body) {
        if (!raw || typeof raw !== "object") {
            continue;
        }
        const jobs = parseJobs(raw.Jobs);
        if (jobs.length === 0) {
            continue;
        }
        groups.push({
            jobs,
            baseASPD: parseBaseASPD(raw.BaseASPD),
        });
    }
    console.log(`[rAthena] job_aspd.yml source: ${resolved.source}`);
    console.log(`[rAthena] job_aspd.yml groups: ${groups.length}`);
    const jobs = new Set();
    let aspdEntries = 0;
    for (const group of groups) {
        for (const job of group.jobs) {
            jobs.add(job);
        }
        aspdEntries +=
            group.baseASPD.size;
    }
    console.log(`[rAthena] job_aspd.yml unique jobs: ${jobs.size}`);
    console.log(`[rAthena] job_aspd.yml ASPD entries: ${aspdEntries}`);
    return {
        groups,
    };
}
