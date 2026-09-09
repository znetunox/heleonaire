import {
  parseSkillTree,
} from "./parsers/skillTreeParser";

import {
  parseJobs,
} from "./parsers/jobParser";

import {
  parseJobStats,
} from "./parsers/jobStatsParser";

import {
  normalizeJobName,
} from "./jobName";

function printSeparator(): void {
  console.log(
    "\n============================================================"
  );
}

function main(): void {
  console.log(
    "=== rAthena Skill Tree Audit ==="
  );

  printSeparator();

  // ---------------------------------------------------------
  // Parse skill tree
  // ---------------------------------------------------------

  const skillTreeResult =
    parseSkillTree();

  // ---------------------------------------------------------
  // Parse official job IDs from mmo.hpp
  // ---------------------------------------------------------

  const jobResult =
    parseJobs();

  // ---------------------------------------------------------
  // Parse job_stats.yml
  // ---------------------------------------------------------

  const statsResult =
    parseJobStats();

  // ---------------------------------------------------------
  // Build lookup sets
  // ---------------------------------------------------------

  const mmoJobs =
    new Map<string, number>();

  for (const job of jobResult.jobs) {
    mmoJobs.set(
      normalizeJobName(job.aegisName),
      job.id
    );
  }

  const statsJobs =
    new Set<string>();

  for (const group of statsResult.groups) {
    for (const jobName of group.jobs) {
      statsJobs.add(
        normalizeJobName(jobName)
      );
    }
  }

  const skillTreeJobs =
    new Map(
      skillTreeResult.jobs.map(
        job => [
          normalizeJobName(job.job),
          job,
        ]
      )
    );

  // ---------------------------------------------------------
  // Basic statistics
  // ---------------------------------------------------------

  printSeparator();

  console.log(
    "SKILL TREE SUMMARY"
  );

  console.log(
    `Skill tree jobs:        ${skillTreeResult.jobs.length}`
  );

  console.log(
    `Skill tree duplicates:  ${skillTreeResult.duplicates}`
  );

  const jobsWithInheritance =
    skillTreeResult.jobs.filter(
      job => job.inherits.length > 0
    );

  const jobsWithoutInheritance =
    skillTreeResult.jobs.filter(
      job => job.inherits.length === 0
    );

  console.log(
    `With inheritance:       ${jobsWithInheritance.length}`
  );

  console.log(
    `Without inheritance:    ${jobsWithoutInheritance.length}`
  );

  // ---------------------------------------------------------
  // Validate jobs against mmo.hpp
  // ---------------------------------------------------------

  const missingFromMmo: string[] = [];

  for (const job of skillTreeResult.jobs) {
    const normalized =
      normalizeJobName(job.job);

    if (!mmoJobs.has(normalized)) {
      missingFromMmo.push(
        normalized
      );
    }
  }

  printSeparator();

  console.log(
    "SKILL TREE -> MMO.HPP"
  );

  console.log(
    `Skill tree jobs:        ${skillTreeResult.jobs.length}`
  );

  console.log(
    `Found in mmo.hpp:       ${
      skillTreeResult.jobs.length -
      missingFromMmo.length
    }`
  );

  console.log(
    `Missing from mmo.hpp:   ${missingFromMmo.length}`
  );

  if (missingFromMmo.length > 0) {
    console.log(
      "\nMissing jobs:"
    );

    for (const job of missingFromMmo) {
      console.log(
        `  ${job}`
      );
    }
  }

  // ---------------------------------------------------------
  // Validate jobs against job_stats.yml
  // ---------------------------------------------------------

  const missingFromStats: string[] = [];

  for (const job of skillTreeResult.jobs) {
    const normalized =
      normalizeJobName(job.job);

    if (!statsJobs.has(normalized)) {
      missingFromStats.push(
        normalized
      );
    }
  }

  printSeparator();

  console.log(
    "SKILL TREE -> JOB_STATS"
  );

  console.log(
    `Skill tree jobs:        ${skillTreeResult.jobs.length}`
  );

  console.log(
    `Found in job_stats:     ${
      skillTreeResult.jobs.length -
      missingFromStats.length
    }`
  );

  console.log(
    `Missing from job_stats: ${missingFromStats.length}`
  );

  if (missingFromStats.length > 0) {
    console.log(
      "\nMissing jobs:"
    );

    for (const job of missingFromStats) {
      console.log(
        `  ${job}`
      );
    }
  }

  // ---------------------------------------------------------
  // Validate inheritance references
  // ---------------------------------------------------------

  const missingInheritanceTargets: Array<{
    job: string;
    inheritedJob: string;
  }> = [];

  for (
    const job of skillTreeResult.jobs
  ) {
    for (
      const inheritedJob of job.inherits
    ) {
      if (!mmoJobs.has(inheritedJob)) {
        missingInheritanceTargets.push({
          job: job.job,
          inheritedJob,
        });
      }
    }
  }

  printSeparator();

  console.log(
    "INHERITANCE VALIDATION"
  );

  console.log(
    `Inheritance references: ${
      skillTreeResult.jobs.reduce(
        (total, job) =>
          total + job.inherits.length,
        0
      )
    }`
  );

  console.log(
    `Invalid references:    ${
      missingInheritanceTargets.length
    }`
  );

  if (
    missingInheritanceTargets.length > 0
  ) {
    console.log(
      "\nInvalid inheritance references:"
    );

    for (
      const entry of
      missingInheritanceTargets
    ) {
      console.log(
        `  ${entry.job} -> ${entry.inheritedJob}`
      );
    }
  }

  // ---------------------------------------------------------
  // Print selected class chains
  // ---------------------------------------------------------

  printSeparator();

  console.log(
    "SELECTED JOB CHAINS"
  );

  const selectedJobs = [
    "NOVICE",

    // Swordman
    "SWORDMAN",
    "KNIGHT",
    "LORD_KNIGHT",
    "RUNE_KNIGHT",
    "DRAGON_KNIGHT",

    // Thief
    "THIEF",
    "ASSASSIN",
    "ASSASSIN_CROSS",
    "GUILLOTINE_CROSS",
    "SHADOW_CROSS",

    // Archer
    "ARCHER",
    "HUNTER",
    "SNIPER",
    "RANGER",
    "WINDHAWK",

    // Mage
    "MAGE",
    "WIZARD",
    "HIGH_WIZARD",
    "WARLOCK",
    "ARCH_MAGE",

    // Acolyte
    "ACOLYTE",
    "PRIEST",
    "HIGH_PRIEST",
    "ARCH_BISHOP",
    "CARDINAL",
  ];

  for (const jobName of selectedJobs) {
    const normalized =
      normalizeJobName(jobName);

    const job =
      skillTreeJobs.get(normalized);

    if (!job) {
      console.log(
        `\n${normalized}`
      );

      console.log(
        "  NOT FOUND"
      );

      continue;
    }

    const id =
      mmoJobs.get(normalized);

    console.log(
      `\n${normalized} (id=${id ?? "?"})`
    );

    if (job.inherits.length === 0) {
      console.log(
        "  inherits: none"
      );
    } else {
      console.log(
        "  inherits:"
      );

      for (
        const inherited of
        job.inherits
      ) {
        const inheritedId =
          mmoJobs.get(inherited);

        console.log(
          `    - ${inherited} (id=${
            inheritedId ?? "?"
          })`
        );
      }
    }
  }

  // ---------------------------------------------------------
  // Print all jobs with inheritance
  // ---------------------------------------------------------

  printSeparator();

  console.log(
    "ALL JOBS WITH INHERITANCE"
  );

  for (
    const job of jobsWithInheritance
  ) {
    console.log(
      `${job.job} -> ${
        job.inherits.join(", ")
      }`
    );
  }

  // ---------------------------------------------------------
  // Jobs in mmo.hpp but not in skill_tree
  // ---------------------------------------------------------

  const missingFromSkillTree: Array<{
    id: number;
    job: string;
  }> = [];

  for (const job of jobResult.jobs) {
    const normalized =
      normalizeJobName(
        job.aegisName
      );

    if (!skillTreeJobs.has(normalized)) {
      missingFromSkillTree.push({
        id: job.id,
        job: normalized,
      });
    }
  }

  printSeparator();

  console.log(
    "MMO.HPP -> SKILL TREE"
  );

  console.log(
    `mmo.hpp jobs:           ${jobResult.jobs.length}`
  );

  console.log(
    `Found in skill tree:    ${
      jobResult.jobs.length -
      missingFromSkillTree.length
    }`
  );

  console.log(
    `Missing from skill tree: ${
      missingFromSkillTree.length
    }`
  );

  if (
    missingFromSkillTree.length > 0
  ) {
    console.log(
      "\nJobs without skill tree:"
    );

    for (
      const job of
      missingFromSkillTree
    ) {
      console.log(
        `  ${job.id} ${job.job}`
      );
    }
  }

  // ---------------------------------------------------------
  // Final result
  // ---------------------------------------------------------

  printSeparator();

  console.log(
    "FINAL RESULT"
  );

  const hasErrors =
    skillTreeResult.duplicates > 0 ||
    missingFromMmo.length > 0 ||
    missingInheritanceTargets.length > 0;

  if (hasErrors) {
    console.log(
      "Skill tree audit: FAILED"
    );

    process.exitCode = 1;
    return;
  }

  console.log(
    "Skill tree audit: OK"
  );

  printSeparator();
}

main();