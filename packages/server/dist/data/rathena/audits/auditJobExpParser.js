import { parseJobExp } from "../parsers/jobExpParser";
console.log("========================================");
console.log("Job EXP Parser Audit");
console.log("========================================");
console.log();
const groups = parseJobExp();
let errors = 0;
for (const group of groups) {
    console.log(`Group #${group.index}`);
    console.log(`  Jobs: ${group.jobs.join(", ")}`);
    console.log(`  MaxJobLevel: ${group.maxJobLevel}`);
    console.log(`  Entries: ${group.entries.length}`);
    if (group.entries.length !== group.maxJobLevel) {
        console.error(`  ERROR: entries=${group.entries.length}, max=${group.maxJobLevel}`);
        errors++;
    }
    for (let i = 0; i < group.entries.length; i++) {
        const entry = group.entries[i];
        if (entry.level !== i + 1) {
            console.error(`  ERROR: expected level ${i + 1}, got ${entry.level}`);
            errors++;
        }
        if (entry.exp < 0n) {
            console.error(`  ERROR: negative EXP at level ${entry.level}`);
            errors++;
        }
    }
    const first = group.entries[0];
    const last = group.entries[group.entries.length - 1];
    console.log(`  First: Level ${first.level} -> ${first.exp} EXP`);
    console.log(`  Last: Level ${last.level} -> ${last.exp} EXP`);
    console.log();
}
console.log("========================================");
console.log("SUMMARY");
console.log("========================================");
console.log(`Job EXP groups: ${groups.length}`);
console.log(`Errors: ${errors}`);
if (errors > 0) {
    console.log("RESULT: FAIL");
    process.exit(1);
}
console.log("RESULT: PASS");
