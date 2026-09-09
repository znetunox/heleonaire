import { parseStatPoints } from "./parsers/statpointParser";
import { parseJobAspd } from "./parsers/jobAspdParser";
console.log("");
console.log("========================================");
console.log("      HELEONAIRE CLASS SOURCES TEST");
console.log("========================================");
console.log("");
const statPoints = parseStatPoints();
const aspd = parseJobAspd();
console.log("");
console.log("=== STAT POINTS ===");
console.log("");
console.log(`Entries: ${statPoints.entries.length}`);
for (const entry of statPoints.entries.slice(0, 10)) {
    console.log(`Lv ${entry.level} | points=${entry.points} | traitPoints=${entry.traitPoints ?? 0}`);
}
console.log("");
console.log("=== ASPD ===");
console.log("");
const jobsWithAspd = new Set();
let totalAspdEntries = 0;
for (const group of aspd.groups) {
    for (const job of group.jobs) {
        jobsWithAspd.add(job);
    }
    totalAspdEntries +=
        group.baseASPD.size;
}
console.log(`Groups: ${aspd.groups.length}`);
console.log(`Jobs: ${jobsWithAspd.size}`);
console.log(`ASPD entries: ${totalAspdEntries}`);
const firstGroup = aspd.groups[0];
if (firstGroup) {
    console.log("");
    console.log(`First group jobs: ${firstGroup.jobs.join(", ")}`);
    for (const [weapon, value,] of firstGroup.baseASPD) {
        console.log(`  ${weapon}: ${value}`);
    }
}
console.log("");
console.log("CLASS SOURCE TEST FINISHED");
