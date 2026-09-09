import { parseJobStats } from "../parsers/jobStatsParser";

function auditJobStats() {
  console.log("");
  console.log("========================================");
  console.log("          RATHENA JOB STATS AUDIT");
  console.log("========================================");
  console.log("");

  const parsed = parseJobStats();

  console.log(`Groups: ${parsed.groups.length}`);

  const jobs = new Set<string>();

  let bonusRows = 0;
  let maxWeightGroups = 0;
  let hpFactorGroups = 0;
  let hpIncreaseGroups = 0;
  let spFactorGroups = 0;
  let spIncreaseGroups = 0;
  let apFactorGroups = 0;
  let apIncreaseGroups = 0;
  let maxStatsGroups = 0;
  let baseExpRows = 0;
  let jobExpRows = 0;
  let baseHpRows = 0;
  let baseSpRows = 0;
  let baseApRows = 0;
  let aspdEntries = 0;

  for (const [index, group] of parsed.groups.entries()) {
    for (const job of group.jobs) {
      jobs.add(job);
    }

    bonusRows += group.bonusStats.length;
    aspdEntries += group.baseASPD.size;

    if (group.maxWeight !== undefined) {
      maxWeightGroups++;
    }

    if (group.hpFactor !== undefined) {
      hpFactorGroups++;
    }

    if (group.hpIncrease !== undefined) {
      hpIncreaseGroups++;
    }

    if (group.spFactor !== undefined) {
      spFactorGroups++;
    }

    if (group.spIncrease !== undefined) {
      spIncreaseGroups++;
    }

    if (group.apFactor !== undefined) {
      apFactorGroups++;
    }

    if (group.apIncrease !== undefined) {
      apIncreaseGroups++;
    }

    if (Object.keys(group.maxStats).length > 0) {
      maxStatsGroups++;
    }

    baseExpRows += group.baseExp.length;
    jobExpRows += group.jobExp.length;
    baseHpRows += group.baseHp.length;
    baseSpRows += group.baseSp.length;
    baseApRows += group.baseAp.length;

    console.log(
      `Group ${String(index + 1).padStart(2)} | ` +
      `jobs=${String(group.jobs.length).padStart(3)} | ` +
      `bonusStats=${String(group.bonusStats.length).padStart(3)} | ` +
      `maxStats=${Object.keys(group.maxStats).length} | ` +
      `maxWeight=${group.maxWeight ?? "-"} | ` +
      `hpFactor=${group.hpFactor ?? "-"} | ` +
      `spFactor=${group.spFactor ?? "-"} | ` +
      `apFactor=${group.apFactor ?? "-"}`
    );
  }

  console.log("");
  console.log("========================================");
  console.log("                 SUMMARY");
  console.log("========================================");
  console.log("");

  console.log(`Groups:             ${parsed.groups.length}`);
  console.log(`Unique jobs:        ${jobs.size}`);
  console.log(`BonusStat rows:     ${bonusRows}`);
  console.log(`ASPD entries:       ${aspdEntries}`);

  console.log("");
  console.log("Class parameters:");
  console.log(`  MaxWeight groups: ${maxWeightGroups}`);
  console.log(`  HpFactor groups:  ${hpFactorGroups}`);
  console.log(`  HpIncrease groups:${hpIncreaseGroups}`);
  console.log(`  SpFactor groups:  ${spFactorGroups}`);
  console.log(`  SpIncrease groups:${spIncreaseGroups}`);
  console.log(`  ApFactor groups:  ${apFactorGroups}`);
  console.log(`  ApIncrease groups:${apIncreaseGroups}`);
  console.log(`  MaxStats groups:  ${maxStatsGroups}`);

  console.log("");
  console.log("Experience tables:");
  console.log(`  BaseExp rows:     ${baseExpRows}`);
  console.log(`  JobExp rows:      ${jobExpRows}`);

  console.log("");
  console.log("Base resource tables:");
  console.log(`  BaseHp rows:      ${baseHpRows}`);
  console.log(`  BaseSp rows:      ${baseSpRows}`);
  console.log(`  BaseAp rows:      ${baseApRows}`);

  console.log("");
  console.log("========================================");

  if (parsed.groups.length !== 83) {
    console.error(
      `[ERROR] Expected 83 groups, got ${parsed.groups.length}`
    );
    process.exitCode = 1;
  } else {
    console.log("       JOB STATS AUDIT PASSED");
  }

  console.log("========================================");
  console.log("");
}

auditJobStats();