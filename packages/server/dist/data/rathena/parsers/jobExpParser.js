import { resolveYaml } from "../importResolver";
function parseNumber(value, field) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    throw new Error(`[JobExpParser] Invalid ${field}: ${String(value)}`);
}
function parseBigInt(value, field) {
    if (typeof value === "bigint") {
        return value;
    }
    if (typeof value === "number" && Number.isSafeInteger(value)) {
        return BigInt(value);
    }
    if (typeof value === "string" && value.trim() !== "") {
        try {
            return BigInt(value.trim());
        }
        catch {
            // fall through
        }
    }
    throw new Error(`[JobExpParser] Invalid ${field}: ${String(value)}`);
}
export function parseJobExp() {
    console.log("[rAthena] Reading job_exp.yml...");
    const resolved = resolveYaml("job_exp.yml");
    const body = resolved.data.Body;
    if (!Array.isArray(body)) {
        throw new Error("[JobExpParser] job_exp.yml Body is not an array");
    }
    const groups = [];
    body.forEach((rawGroup, index) => {
        if (!Array.isArray(rawGroup.JobExp) ||
            rawGroup.JobExp.length === 0) {
            return;
        }
        const maxJobLevel = parseNumber(rawGroup.MaxJobLevel, `Body[${index}].MaxJobLevel`);
        const jobs = Object.keys(rawGroup.Jobs ?? {});
        const entries = rawGroup.JobExp.map((rawEntry, entryIndex) => {
            const level = parseNumber(rawEntry.Level, `Body[${index}].JobExp[${entryIndex}].Level`);
            const exp = parseBigInt(rawEntry.Exp, `Body[${index}].JobExp[${entryIndex}].Exp`);
            return {
                level,
                exp,
            };
        });
        groups.push({
            index,
            jobs,
            maxJobLevel,
            entries,
        });
    });
    console.log(`[rAthena] job_exp.yml Job EXP groups: ${groups.length}`);
    return groups;
}
