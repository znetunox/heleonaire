import { parseJobHierarchy, } from "./parsers/jobHierarchyParser";
function separator() {
    console.log("\n============================================================");
}
function printChain(result, jobs) {
    const map = new Map(result.jobs.map(job => [
        job.job,
        job,
    ]));
    for (const jobName of jobs) {
        const job = map.get(jobName);
        if (!job) {
            console.log(`\n${jobName}: NOT FOUND`);
            continue;
        }
        console.log(`\n${job.job} (id=${job.id}, statsGroup=${job.statsGroup ?? "none"})`);
        console.log(`  candidateParent: ${job.candidateParent ?? "none"}`);
        console.log(`  skillInheritance: ${job.skillInheritance.length > 0
            ? job.skillInheritance.join(", ")
            : "none"}`);
    }
}
function main() {
    console.log("=== rAthena Job Hierarchy Audit ===");
    const result = parseJobHierarchy();
    separator();
    console.log("SUMMARY");
    console.log(`Jobs:                 ${result.jobs.length}`);
    console.log(`Missing stats:        ${result.missingStats.length}`);
    console.log(`Missing skill tree:   ${result.missingSkillTree.length}`);
    console.log(`Ambiguous parents:    ${result.ambiguousParents.length}`);
    // ---------------------------------------------------------
    // Core playable progression chains
    // ---------------------------------------------------------
    separator();
    console.log("SWORDMAN / KNIGHT CHAIN");
    printChain(result, [
        "NOVICE",
        "SWORDMAN",
        "KNIGHT",
        "LORD_KNIGHT",
        "RUNE_KNIGHT",
        "DRAGON_KNIGHT",
    ]);
    separator();
    console.log("THIEF / ASSASSIN CHAIN");
    printChain(result, [
        "NOVICE",
        "THIEF",
        "ASSASSIN",
        "ASSASSIN_CROSS",
        "GUILLOTINE_CROSS",
        "SHADOW_CROSS",
    ]);
    separator();
    console.log("ARCHER CHAIN");
    printChain(result, [
        "NOVICE",
        "ARCHER",
        "HUNTER",
        "SNIPER",
        "RANGER",
        "WINDHAWK",
    ]);
    separator();
    console.log("MAGE CHAIN");
    printChain(result, [
        "NOVICE",
        "MAGE",
        "WIZARD",
        "HIGH_WIZARD",
        "WARLOCK",
        "ARCH_MAGE",
    ]);
    separator();
    console.log("ACOLYTE CHAIN");
    printChain(result, [
        "NOVICE",
        "ACOLYTE",
        "PRIEST",
        "HIGH_PRIEST",
        "ARCH_BISHOP",
        "CARDINAL",
    ]);
    // ---------------------------------------------------------
    // All candidate parents
    // ---------------------------------------------------------
    separator();
    console.log("ALL CANDIDATE PARENTS");
    for (const job of result.jobs) {
        if (!job.candidateParent) {
            continue;
        }
        console.log(`${job.job} -> ${job.candidateParent}`);
    }
    // ---------------------------------------------------------
    // Ambiguities
    // ---------------------------------------------------------
    separator();
    console.log("AMBIGUOUS PARENTS");
    if (result.ambiguousParents.length === 0) {
        console.log("None");
    }
    else {
        for (const job of result.ambiguousParents) {
            console.log(`  ${job}`);
        }
    }
    // ---------------------------------------------------------
    // Missing stats
    // ---------------------------------------------------------
    separator();
    console.log("MISSING STATS");
    if (result.missingStats.length === 0) {
        console.log("None");
    }
    else {
        for (const job of result.missingStats) {
            console.log(`  ${job}`);
        }
    }
    // ---------------------------------------------------------
    // Missing skill tree
    // ---------------------------------------------------------
    separator();
    console.log("MISSING SKILL TREE");
    if (result.missingSkillTree.length === 0) {
        console.log("None");
    }
    else {
        for (const job of result.missingSkillTree) {
            console.log(`  ${job}`);
        }
    }
    // ---------------------------------------------------------
    // Final
    // ---------------------------------------------------------
    separator();
    console.log("FINAL RESULT");
    if (result.ambiguousParents.length > 0) {
        console.log("Hierarchy audit requires manual review.");
        process.exitCode = 1;
        return;
    }
    console.log("Hierarchy audit completed.");
}
main();
