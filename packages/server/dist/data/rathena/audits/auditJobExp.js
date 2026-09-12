import { resolveYaml } from "../importResolver";
import { parseJobCatalog } from "../jobCatalogParser";
function normalizeJobName(name) {
    return name.trim().toUpperCase();
}
function toNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}
const resolved = resolveYaml("job_exp.yml");
const data = resolved.data;
if (!Array.isArray(data.Body)) {
    throw new Error("job_exp.yml: Body não é um array");
}
const groups = data.Body;
console.log("========================================");
console.log("rAthena Job EXP Detailed Audit");
console.log("========================================");
console.log();
console.log(`Fonte: ${resolved.source}`);
console.log(`Arquivo: ${resolved.path}`);
console.log(`Header Type: ${String(data.Header?.Type)}`);
console.log(`Header Version: ${String(data.Header?.Version)}`);
console.log(`Total de grupos: ${groups.length}`);
console.log();
const catalog = parseJobCatalog();
const playableJobs = catalog.jobs.filter((job) => job.playable);
const errors = [];
const usedGroups = new Set();
for (const job of playableJobs) {
    const normalizedTarget = normalizeJobName(job.job);
    const matches = groups
        .map((group, index) => ({
        index,
        group,
        matches: Array.isArray(group.JobExp) &&
            group.JobExp.length > 0 &&
            !!group.Jobs &&
            Object.keys(group.Jobs).some(name => normalizeJobName(name) === normalizedTarget),
    }))
        .filter(entry => entry.matches);
    if (matches.length !== 1) {
        errors.push(`${job.job}: esperado exatamente 1 grupo, encontrado ${matches.length}`);
        continue;
    }
    const { index, group } = matches[0];
    usedGroups.add(index);
    const maxJobLevel = toNumber(group.MaxJobLevel);
    const entries = group.JobExp ?? [];
    console.log(`JOB: ${job.job}`);
    console.log(`  ID: ${job.id}`);
    console.log(`  Tier: ${job.tier}`);
    console.log(`  Group: #${index}`);
    console.log(`  MaxJobLevel: ${maxJobLevel}`);
    console.log(`  Entries: ${entries.length}`);
    if (maxJobLevel === undefined) {
        errors.push(`${job.job}: MaxJobLevel inválido`);
    }
    if (maxJobLevel !== undefined && entries.length !== maxJobLevel) {
        errors.push(`${job.job}: entries=${entries.length}, MaxJobLevel=${maxJobLevel}`);
    }
    const levels = [];
    const expValues = [];
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const level = toNumber(entry.Level);
        const exp = toNumber(entry.Exp);
        if (level === undefined) {
            errors.push(`${job.job}: entry #${i}: Level inválido`);
            continue;
        }
        if (exp === undefined) {
            errors.push(`${job.job}: Level ${level}: Exp inválido`);
            continue;
        }
        levels.push(level);
        expValues.push(exp);
        if (level !== i + 1) {
            errors.push(`${job.job}: posição ${i + 1} contém Level ${level}`);
        }
        if (exp < 0) {
            errors.push(`${job.job}: Level ${level}: EXP negativa (${exp})`);
        }
    }
    const duplicateLevels = levels.filter((level, i) => levels.indexOf(level) !== i);
    if (duplicateLevels.length > 0) {
        errors.push(`${job.job}: níveis duplicados: ${[
            ...new Set(duplicateLevels),
        ].join(", ")}`);
    }
    if (levels.length > 0) {
        console.log(`  First: Level ${levels[0]} -> ${expValues[0]} EXP`);
        console.log(`  Last:  Level ${levels[levels.length - 1]} -> ${expValues[expValues.length - 1]} EXP`);
        console.log("  Full table:");
        for (let i = 0; i < levels.length; i++) {
            console.log(`    Job ${levels[i]} -> ${expValues[i].toLocaleString()} EXP`);
        }
    }
    console.log("  RESULT: OK");
    console.log();
}
console.log("========================================");
console.log("GROUP USAGE");
console.log("========================================");
for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const hasJobExp = Array.isArray(group.JobExp) &&
        group.JobExp.length > 0;
    if (!hasJobExp) {
        continue;
    }
    const jobs = Object.keys(group.Jobs ?? {});
    console.log(`Group #${i}: ${usedGroups.has(i) ? "USED" : "UNUSED"}`);
    console.log(`  MaxJobLevel: ${String(group.MaxJobLevel)}`);
    console.log(`  JobExp entries: ${group.JobExp?.length ?? 0}`);
    console.log(`  Jobs: ${jobs.join(", ")}`);
    console.log();
}
console.log("========================================");
console.log("SUMMARY");
console.log("========================================");
console.log(`Playable jobs: ${playableJobs.length}`);
console.log(`Groups: ${groups.length}`);
console.log(`Job EXP groups used: ${usedGroups.size}`);
console.log(`Errors: ${errors.length}`);
if (errors.length > 0) {
    console.log();
    console.log("ERRORS:");
    for (const error of errors) {
        console.log(`  - ${error}`);
    }
    console.log();
    console.log("RESULT: FAIL");
    process.exit(1);
}
console.log();
console.log("RESULT: PASS");
