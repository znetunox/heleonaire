import { parseJobCatalog } from "./jobCatalogParser";
import { parseJobAspd } from "./parsers/jobAspdParser";
import { parseStatPoints } from "./parsers/statpointParser";
import { normalizeJobName } from "./jobName";

console.log("");
console.log("========================================");
console.log("      HELEONAIRE CLASS SOURCE AUDIT");
console.log("========================================");
console.log("");

const catalog = parseJobCatalog();
const aspd = parseJobAspd();
const statPoints = parseStatPoints();

const aspdJobs = new Set<string>();

for (const group of aspd.groups) {
  for (const job of group.jobs) {
    aspdJobs.add(normalizeJobName(job));
  }
}

const missingAspd: string[] = [];

for (const job of catalog.jobs) {
  if (!aspdJobs.has(normalizeJobName(job.job))) {
    missingAspd.push(job.job);
  }
}

console.log("");
console.log("=== PLAYABLE JOBS ===");
console.log("");

for (const branch of catalog.branches) {
  console.log(branch.heleonaireClass.toUpperCase());

  for (const jobName of branch.jobs) {
    const job = catalog.jobs.find(
      (entry) => entry.job === normalizeJobName(jobName)
    );

    if (!job) {
      console.log(`  ${jobName} | NOT FOUND`);
      continue;
    }

    const hasAspd = aspdJobs.has(job.job);

    console.log(
      `  ${job.job.padEnd(20)} | ` +
      `id=${job.id.toString().padEnd(5)} | ` +
      `stats=${job.statsGroup.toString().padEnd(3)} | ` +
      `ASPD=${hasAspd ? "OK" : "MISSING"} | ` +
      `skills=${job.skillInheritance.length}`
    );
  }

  console.log("");
}

console.log("=== FINAL AUDIT ===");
console.log("");

console.log(`Heleonaire jobs:       ${catalog.jobs.length}`);
console.log(`Missing mmo.hpp:       ${catalog.missingFromMmo.length}`);
console.log(`Missing job_stats:     ${catalog.missingStats.length}`);
console.log(`Missing skill_tree:    ${catalog.missingSkillTree.length}`);
console.log(`Missing job_aspd:      ${missingAspd.length}`);
console.log(`Invalid parents:       ${catalog.invalidParents.length}`);

console.log("");
console.log("=== GLOBAL SOURCES ===");
console.log("");

console.log(`Stat point levels:      ${statPoints.entries.length}`);
console.log(`ASPD jobs:              ${aspdJobs.size}`);

let aspdEntries = 0;

for (const group of aspd.groups) {
  aspdEntries += group.baseASPD.size;
}

console.log(`ASPD entries:           ${aspdEntries}`);

console.log("");
console.log("=== RESULT ===");
console.log("");

if (
  catalog.jobs.length !== 25 ||
  catalog.missingFromMmo.length > 0 ||
  catalog.missingStats.length > 0 ||
  catalog.missingSkillTree.length > 0 ||
  missingAspd.length > 0 ||
  catalog.invalidParents.length > 0 ||
  statPoints.entries.length === 0
) {
  console.error("CLASS SOURCE AUDIT FAILED");
  process.exit(1);
}

console.log("ALL CLASS SOURCES VALID");