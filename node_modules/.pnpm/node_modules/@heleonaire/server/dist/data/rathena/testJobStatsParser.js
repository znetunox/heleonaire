import { parseJobStats } from "./parsers/jobStatsParser";
function main() {
    const result = parseJobStats();
    console.log("");
    console.log("========================================");
    console.log("      rAthena JOB STATS JOB AUDIT");
    console.log("========================================");
    console.log("");
    const jobGroups = new Map();
    let groupIndex = 0;
    for (const group of result.groups) {
        groupIndex++;
        for (const job of group.jobs) {
            const groups = jobGroups.get(job) ?? [];
            groups.push(groupIndex);
            jobGroups.set(job, groups);
        }
    }
    console.log(`Groups: ${result.groups.length}`);
    console.log(`Unique Jobs: ${jobGroups.size}`);
    console.log("");
    const duplicatedJobs = [];
    for (const [job, groups] of jobGroups) {
        if (groups.length > 1) {
            duplicatedJobs.push(`${job} -> groups ${groups.join(", ")}`);
        }
    }
    console.log(`Jobs in multiple groups: ${duplicatedJobs.length}`);
    if (duplicatedJobs.length > 0) {
        console.log("");
        for (const entry of duplicatedJobs) {
            console.log(`  ${entry}`);
        }
    }
    console.log("");
    console.log("----------------------------------------");
    console.log("JOB -> GROUP");
    console.log("----------------------------------------");
    console.log("");
    for (const [job, groups] of jobGroups) {
        console.log(`${job.padEnd(30)} -> ${groups.join(", ")}`);
    }
    console.log("");
    console.log("----------------------------------------");
    console.log("GROUP SUMMARY");
    console.log("----------------------------------------");
    console.log("");
    result.groups.forEach((group, index) => {
        console.log(`[${String(index + 1).padStart(2, "0")}] ` +
            `${group.jobs.join(", ")}`);
        console.log(`     BonusStats: ${group.bonusStats.length}`);
        console.log(`     ASPD: ${group.baseASPD.size}`);
        console.log(`     MaxWeight: ${group.maxWeight ?? "-"}`);
        console.log("");
    });
}
main();
