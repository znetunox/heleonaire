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
function parseEntries(entries) {
    if (!Array.isArray(entries)) {
        return [];
    }
    return entries
        .map((entry) => ({
        level: toNumber(entry.Level),
        points: toNumber(entry.Points),
    }))
        .filter((entry) => entry.level > 0);
}
export function parseJobBasepoints() {
    console.log("[rAthena] Reading job_basepoints.yml...");
    const resolved = resolveYaml("job_basepoints.yml");
    const body = Array.isArray(resolved.data)
        ? resolved.data
        : resolved.data?.Body ?? [];
    const entries = parseEntries(body);
    console.log(`[rAthena] job_basepoints.yml source: ${resolved.source}`);
    console.log(`[rAthena] job_basepoints.yml entries: ${entries.length}`);
    return {
        entries,
    };
}
