import { getHeleonaireProgression, parseJobCatalog, } from "./jobCatalogParser";
function assert(condition, message) {
    if (!condition) {
        throw new Error(`ASSERTION FAILED: ${message}`);
    }
}
console.log("");
console.log("========================================");
console.log("      HELEONAIRE JOB CATALOG TEST");
console.log("========================================");
console.log("");
const result = parseJobCatalog();
console.log("");
console.log("=== SUMMARY ===");
console.log("");
console.log(`Catalog jobs:          ${result.jobs.length}`);
console.log(`Playable jobs:         ${result.playableJobs.length}`);
console.log(`Missing mmo.hpp:       ${result.missingFromMmo.length}`);
console.log(`Missing stats:         ${result.missingStats.length}`);
console.log(`Missing skill tree:    ${result.missingSkillTree.length}`);
console.log(`Invalid parents:       ${result.invalidParents.length}`);
console.log(`Duplicate jobs:        ${result.duplicateJobs.length}`);
console.log("");
console.log("=== PROGRESSION ===");
console.log("");
for (const branch of result.branches) {
    console.log(`${branch.heleonaireClass.toUpperCase()}`);
    for (const jobName of branch.jobs) {
        const job = result.jobs.find((entry) => entry.job === jobName);
        if (!job) {
            console.log(`  ${jobName}`);
            continue;
        }
        console.log(`  ${job.job}` +
            ` | id=${job.id}` +
            ` | statsGroup=${job.statsGroup}` +
            ` | tier=${job.tier}` +
            ` | parent=${job.parentJob ?? "none"}`);
    }
    console.log("");
}
console.log("=== SKILL INHERITANCE ===");
console.log("");
const importantJobs = [
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
for (const jobName of importantJobs) {
    const job = result.jobs.find((entry) => entry.job === jobName);
    if (!job) {
        console.log(`${jobName} -> NOT FOUND`);
        continue;
    }
    console.log(`${job.job} -> ` +
        `${job.skillInheritance.length > 0
            ? job.skillInheritance.join(", ")
            : "none"}`);
}
console.log("");
console.log("=== VALIDATION ===");
console.log("");
assert(result.missingFromMmo.length === 0, `Some catalog jobs are missing from mmo.hpp: ${result.missingFromMmo.join(", ")}`);
assert(result.missingStats.length === 0, `Some catalog jobs are missing from job_stats.yml: ${result.missingStats.join(", ")}`);
assert(result.missingSkillTree.length === 0, `Some catalog jobs are missing from skill_tree.yml: ${result.missingSkillTree.join(", ")}`);
assert(result.invalidParents.length === 0, `Invalid parent relationships: ${result.invalidParents.join(", ")}`);
assert(result.duplicateJobs.length === 0, `Duplicate jobs found: ${result.duplicateJobs.join(", ")}`);
assert(result.jobs.length === 25, `Expected exactly 25 playable jobs, got ${result.jobs.length}`);
assert(result.branches.length === 5, `Expected 5 branches, got ${result.branches.length}`);
for (const branch of result.branches) {
    assert(branch.jobs.length === 5, `${branch.heleonaireClass} should contain exactly 5 jobs, got ${branch.jobs.length}`);
}
function assertParent(jobName, expectedParent) {
    const job = result.jobs.find((entry) => entry.job === jobName);
    assert(!!job, `${jobName} was not found`);
    assert(job.parentJob === expectedParent, `${jobName} expected parent ${expectedParent ?? "none"}, got ${job.parentJob ?? "none"}`);
}
assertParent("SWORDMAN", undefined);
assertParent("KNIGHT", "SWORDMAN");
assertParent("LORD_KNIGHT", "KNIGHT");
assertParent("RUNE_KNIGHT", "KNIGHT");
assertParent("DRAGON_KNIGHT", "RUNE_KNIGHT");
assertParent("THIEF", undefined);
assertParent("ASSASSIN", "THIEF");
assertParent("ASSASSIN_CROSS", "ASSASSIN");
assertParent("GUILLOTINE_CROSS", "ASSASSIN");
assertParent("SHADOW_CROSS", "GUILLOTINE_CROSS");
assertParent("ARCHER", undefined);
assertParent("HUNTER", "ARCHER");
assertParent("SNIPER", "HUNTER");
assertParent("RANGER", "HUNTER");
assertParent("WINDHAWK", "RANGER");
assertParent("MAGE", undefined);
assertParent("WIZARD", "MAGE");
assertParent("HIGH_WIZARD", "WIZARD");
assertParent("WARLOCK", "WIZARD");
assertParent("ARCH_MAGE", "WARLOCK");
assertParent("ACOLYTE", undefined);
assertParent("PRIEST", "ACOLYTE");
assertParent("HIGH_PRIEST", "PRIEST");
assertParent("ARCH_BISHOP", "PRIEST");
assertParent("CARDINAL", "ARCH_BISHOP");
console.log("All assertions passed.");
console.log("");
console.log("=== RAW PROGRESSION CONFIG ===");
console.log("");
for (const branch of getHeleonaireProgression()) {
    console.log(`${branch.heleonaireClass}: ${branch.jobs.join(" -> ")}`);
}
console.log("");
console.log("JOB CATALOG TEST PASSED");
console.log("");
