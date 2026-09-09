import { parseJobs } from "./parsers/jobParser";
import { parseJobStats } from "./parsers/jobStatsParser";
import { normalizeJobName } from "./jobName";

function main() {
  const jobResult = parseJobs();

  const statsResult = parseJobStats();
  const statsGroups = statsResult.groups;

  const jobToGroup = new Map<string, number>();

  statsGroups.forEach((group, index) => {
    for (const jobName of group.jobs) {
      jobToGroup.set(
        normalizeJobName(jobName),
        index + 1
      );
    }
  });

  const matched = [];
  const missingFromStats = [];

  for (const job of jobResult.jobs) {
    const normalizedName = normalizeJobName(
      job.aegisName
    );

    const group = jobToGroup.get(normalizedName);

    if (group !== undefined) {
      matched.push({
        ...job,
        group,
      });
    } else {
      missingFromStats.push(job);
    }
  }

  console.log("");
  console.log("========================================");
  console.log("       rAthena JOB CROSS AUDIT");
  console.log("========================================");
  console.log("");

  console.log(
    `mmo.hpp jobs:        ${jobResult.jobs.length}`
  );

  console.log(
    `job_stats groups:    ${statsGroups.length}`
  );

  console.log(
    `job_stats jobs:      ${jobToGroup.size}`
  );

  console.log(
    `Matched jobs:        ${matched.length}`
  );

  console.log(
    `Missing from stats:  ${missingFromStats.length}`
  );

  console.log("");
  console.log("----------------------------------------");
  console.log("MATCHED JOBS");
  console.log("----------------------------------------");
  console.log("");

  for (const job of matched) {
    console.log(
      `${String(job.id).padEnd(8)} ` +
      `${job.aegisName.padEnd(28)} ` +
      `group=${job.group}`
    );
  }

  console.log("");
  console.log("----------------------------------------");
  console.log("JOBS WITHOUT job_stats.yml");
  console.log("----------------------------------------");
  console.log("");

  for (const job of missingFromStats) {
    console.log(
      `${String(job.id).padEnd(8)} ${job.aegisName}`
    );
  }

  console.log("");
  console.log("----------------------------------------");
  console.log("PLAYABLE HELEONAIRE CLASSES");
  console.log("----------------------------------------");
  console.log("");

  const playable = [
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

  for (const name of playable) {
    const job = jobResult.jobs.find(
      (entry) =>
        normalizeJobName(entry.aegisName) === name
    );

    const group = job
      ? jobToGroup.get(
          normalizeJobName(job.aegisName)
        )
      : undefined;

    console.log(
      `${name.padEnd(24)} ` +
      `id=${job?.id ?? "NOT FOUND"} ` +
      `group=${group ?? "NOT FOUND"}`
    );
  }
}

main();