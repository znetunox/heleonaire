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
function toOptionalNumber(value) {
    if (value === undefined || value === null) {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed)
        ? parsed
        : undefined;
}
export function parseStatPoints() {
    console.log("[rAthena] Reading statpoint.yml...");
    const resolved = resolveYaml("statpoint.yml");
    const body = Array.isArray(resolved.data)
        ? resolved.data
        : resolved.data?.Body ?? [];
    const entries = [];
    for (const raw of body) {
        if (!raw || typeof raw !== "object") {
            continue;
        }
        const level = toNumber(raw.Level);
        if (level <= 0) {
            continue;
        }
        entries.push({
            level,
            points: toNumber(raw.Points),
            traitPoints: toOptionalNumber(raw.TraitPoints),
        });
    }
    console.log(`[rAthena] statpoint.yml source: ${resolved.source}`);
    console.log(`[rAthena] statpoint.yml entries: ${entries.length}`);
    return {
        entries,
    };
}
