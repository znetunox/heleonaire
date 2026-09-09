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
function parseJobs(jobs) {
    if (!jobs || typeof jobs !== "object") {
        return [];
    }
    return Object.entries(jobs)
        .filter(([, enabled]) => enabled === true)
        .map(([name]) => name);
}
function parseNumberMap(value) {
    if (!value || typeof value !== "object") {
        return {};
    }
    const result = {};
    for (const [key, rawValue] of Object.entries(value)) {
        const parsed = Number(rawValue);
        if (Number.isFinite(parsed)) {
            result[key] = parsed;
        }
    }
    return result;
}
function parseBonusStats(entries) {
    if (!Array.isArray(entries)) {
        return [];
    }
    return entries
        .map((entry) => ({
        level: toNumber(entry.Level),
        str: toOptionalNumber(entry.Str),
        agi: toOptionalNumber(entry.Agi),
        vit: toOptionalNumber(entry.Vit),
        int: toOptionalNumber(entry.Int),
        dex: toOptionalNumber(entry.Dex),
        luk: toOptionalNumber(entry.Luk),
        pow: toOptionalNumber(entry.Pow),
        sta: toOptionalNumber(entry.Sta),
        wis: toOptionalNumber(entry.Wis),
        spl: toOptionalNumber(entry.Spl),
        con: toOptionalNumber(entry.Con),
        crt: toOptionalNumber(entry.Crt),
    }))
        .filter((entry) => entry.level > 0);
}
function parseExpTable(entries) {
    if (!Array.isArray(entries)) {
        return [];
    }
    return entries
        .map((entry) => ({
        level: toNumber(entry.Level),
        exp: toNumber(entry.Exp),
    }))
        .filter((entry) => entry.level > 0);
}
function parseHpTable(entries) {
    if (!Array.isArray(entries)) {
        return [];
    }
    return entries
        .map((entry) => ({
        level: toNumber(entry.Level),
        hp: toNumber(entry.Hp),
    }))
        .filter((entry) => entry.level > 0);
}
function parseSpTable(entries) {
    if (!Array.isArray(entries)) {
        return [];
    }
    return entries
        .map((entry) => ({
        level: toNumber(entry.Level),
        sp: toNumber(entry.Sp),
    }))
        .filter((entry) => entry.level > 0);
}
function parseApTable(entries) {
    if (!Array.isArray(entries)) {
        return [];
    }
    return entries
        .map((entry) => ({
        level: toNumber(entry.Level),
        ap: toNumber(entry.Ap),
    }))
        .filter((entry) => entry.level > 0);
}
function parseRawGroup(raw) {
    const baseASPD = new Map();
    if (raw.BaseASPD) {
        for (const [weaponType, value] of Object.entries(raw.BaseASPD)) {
            baseASPD.set(weaponType, toNumber(value));
        }
    }
    return {
        jobs: parseJobs(raw.Jobs),
        maxWeight: toOptionalNumber(raw.MaxWeight),
        hpFactor: toOptionalNumber(raw.HpFactor),
        hpIncrease: toOptionalNumber(raw.HpIncrease),
        spFactor: toOptionalNumber(raw.SpFactor),
        spIncrease: toOptionalNumber(raw.SpIncrease),
        apFactor: toOptionalNumber(raw.ApFactor),
        apIncrease: toOptionalNumber(raw.ApIncrease),
        baseASPD,
        bonusStats: parseBonusStats(raw.BonusStats),
        maxStats: parseNumberMap(raw.MaxStats),
        baseExp: parseExpTable(raw.BaseExp),
        jobExp: parseExpTable(raw.JobExp),
        baseHp: parseHpTable(raw.BaseHp),
        baseSp: parseSpTable(raw.BaseSp),
        baseAp: parseApTable(raw.BaseAp),
    };
}
export function parseJobStats() {
    console.log("[rAthena] Reading job_stats.yml...");
    const resolved = resolveYaml("job_stats.yml");
    const body = Array.isArray(resolved.data)
        ? resolved.data
        : resolved.data?.Body ?? [];
    const groups = [];
    for (const raw of body) {
        const group = parseRawGroup(raw);
        if (group.jobs.length === 0) {
            continue;
        }
        groups.push(group);
    }
    console.log(`[rAthena] job_stats.yml source: ${resolved.source}`);
    console.log(`[rAthena] job_stats.yml groups: ${groups.length}`);
    return {
        groups,
    };
}
