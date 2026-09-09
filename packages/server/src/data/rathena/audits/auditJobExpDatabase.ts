import { prisma } from "../../../db/prisma";
import { parseJobExp } from "../parsers/jobExpParser";
import { parseJobCatalog } from "../jobCatalogParser";
import { normalizeJobName } from "../jobName";

function createSourceKey(jobs: string[]): string {
  return jobs
    .map((job) => normalizeJobName(job))
    .sort()
    .join("|");
}

function bigintEqual(a: bigint, b: bigint): boolean {
  return a === b;
}

async function main() {
  console.log("");
  console.log("========================================");
  console.log("       JOB EXP DATABASE AUDIT");
  console.log("========================================");
  console.log("");

  const sourceGroups = parseJobExp();
  const catalog = parseJobCatalog();

  const dbGroups = await prisma.jobExpGroup.findMany({
    include: {
      entries: {
        orderBy: {
          level: "asc",
        },
      },
      classes: {
        select: {
          id: true,
          aegisName: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  const errors: string[] = [];

  // ============================================================
  // GROUP COUNT
  // ============================================================

  console.log(`[Audit] Source groups: ${sourceGroups.length}`);
  console.log(`[Audit] DB groups:     ${dbGroups.length}`);

  if (sourceGroups.length !== dbGroups.length) {
    errors.push(
      `Group count mismatch: source=${sourceGroups.length}, db=${dbGroups.length}`
    );
  }

  // ============================================================
  // GROUPS
  // ============================================================

  const dbGroupsByKey = new Map(
    dbGroups.map((group) => [group.sourceKey, group])
  );

  let expectedEntries = 0;
  let actualEntries = 0;

  for (const sourceGroup of sourceGroups) {
    const sourceKey = createSourceKey(sourceGroup.jobs);

    expectedEntries += sourceGroup.entries.length;

    const dbGroup = dbGroupsByKey.get(sourceKey);

    if (!dbGroup) {
      errors.push(
        `Missing group: sourceKey=${sourceKey}`
      );
      continue;
    }

    actualEntries += dbGroup.entries.length;

    // ----------------------------------------------------------
    // MaxJobLevel
    // ----------------------------------------------------------

    if (dbGroup.maxJobLevel !== sourceGroup.maxJobLevel) {
      errors.push(
        `MaxJobLevel mismatch: ${sourceKey} ` +
        `source=${sourceGroup.maxJobLevel} ` +
        `db=${dbGroup.maxJobLevel}`
      );
    }

    // ----------------------------------------------------------
    // Entry count
    // ----------------------------------------------------------

    if (dbGroup.entries.length !== sourceGroup.entries.length) {
      errors.push(
        `Entry count mismatch: ${sourceKey} ` +
        `source=${sourceGroup.entries.length} ` +
        `db=${dbGroup.entries.length}`
      );
    }

    // ----------------------------------------------------------
    // Entries
    // ----------------------------------------------------------

    const dbEntries = new Map(
      dbGroup.entries.map((entry) => [entry.level, entry])
    );

    for (const sourceEntry of sourceGroup.entries) {
      const dbEntry = dbEntries.get(sourceEntry.level);

      if (!dbEntry) {
        errors.push(
          `Missing entry: ${sourceKey} level=${sourceEntry.level}`
        );
        continue;
      }

      if (!bigintEqual(dbEntry.exp, sourceEntry.exp)) {
        errors.push(
          `EXP mismatch: ${sourceKey} level=${sourceEntry.level} ` +
          `source=${sourceEntry.exp} db=${dbEntry.exp}`
        );
      }
    }

    // ----------------------------------------------------------
    // Hash
    // ----------------------------------------------------------

    const normalizedJobs = sourceGroup.jobs
      .map((job) => normalizeJobName(job))
      .sort();

    const expectedHashInput = {
      jobs: normalizedJobs,
      maxJobLevel: sourceGroup.maxJobLevel,
      entries: sourceGroup.entries,
    };

    const { createHash } = await import("crypto");

    const expectedHash = createHash("sha256")
      .update(
        JSON.stringify(
          expectedHashInput,
          (_key, value) =>
            typeof value === "bigint"
              ? value.toString()
              : value
        )
      )
      .digest("hex");

    if (dbGroup.sourceHash !== expectedHash) {
      errors.push(
        `Hash mismatch: ${sourceKey}`
      );
    }
  }

  // ============================================================
  // EXTRA GROUPS
  // ============================================================

  const sourceKeys = new Set(
    sourceGroups.map((group) => createSourceKey(group.jobs))
  );

  for (const dbGroup of dbGroups) {
    if (!sourceKeys.has(dbGroup.sourceKey)) {
      errors.push(
        `Extra DB group: sourceKey=${dbGroup.sourceKey}`
      );
    }
  }

  // ============================================================
  // ENTRY TOTAL
  // ============================================================

  console.log("");
  console.log(`[Audit] Expected entries: ${expectedEntries}`);
  console.log(`[Audit] Actual entries:   ${actualEntries}`);

  if (expectedEntries !== actualEntries) {
    errors.push(
      `Total entry mismatch: source=${expectedEntries}, db=${actualEntries}`
    );
  }

  // ============================================================
  // PLAYABLE CLASS LINKS
  // ============================================================

  const playableJobs = catalog.jobs.filter(
    (job) => job.playable
  );

  console.log("");
  console.log(`[Audit] Playable classes: ${playableJobs.length}`);

  let linkedClasses = 0;

  for (const job of playableJobs) {
    const jobName = normalizeJobName(job.job);

    const sourceGroup = sourceGroups.find((group) =>
      group.jobs.some(
        (groupJob) =>
          normalizeJobName(groupJob) === jobName
      )
    );

    if (!sourceGroup) {
      errors.push(
        `Source Job EXP group missing for class: ${jobName}`
      );
      continue;
    }

    const sourceKey = createSourceKey(sourceGroup.jobs);

    const dbClass = await prisma.gameClass.findUnique({
      where: {
        aegisName: job.job,
      },
      select: {
        id: true,
        aegisName: true,
        jobExpGroupId: true,
        jobExpGroup: {
          select: {
            sourceKey: true,
            maxJobLevel: true,
          },
        },
      },
    });

    if (!dbClass) {
      errors.push(
        `GameClass missing: ${jobName}`
      );
      continue;
    }

    if (!dbClass.jobExpGroupId) {
      errors.push(
        `GameClass not linked: ${jobName}`
      );
      continue;
    }

    if (!dbClass.jobExpGroup) {
      errors.push(
        `GameClass linked to missing group: ${jobName}`
      );
      continue;
    }

    if (dbClass.jobExpGroup.sourceKey !== sourceKey) {
      errors.push(
        `Wrong Job EXP group: ${jobName} ` +
        `expected=${sourceKey} ` +
        `actual=${dbClass.jobExpGroup.sourceKey}`
      );
      continue;
    }

    linkedClasses++;
  }

  console.log(`[Audit] Linked classes:  ${linkedClasses}`);

  if (linkedClasses !== playableJobs.length) {
    errors.push(
      `Linked class count mismatch: expected=${playableJobs.length}, actual=${linkedClasses}`
    );
  }

  // ============================================================
  // SUMMARY
  // ============================================================

  console.log("");
  console.log("========================================");
  console.log("              AUDIT RESULT");
  console.log("========================================");
  console.log("");

  console.log(`Groups expected:       ${sourceGroups.length}`);
  console.log(`Groups found:          ${dbGroups.length}`);
  console.log(`Entries expected:      ${expectedEntries}`);
  console.log(`Entries found:         ${actualEntries}`);
  console.log(`Playable classes:      ${playableJobs.length}`);
  console.log(`Classes linked:        ${linkedClasses}`);

  console.log("");
  console.log(`Errors:                ${errors.length}`);

  if (errors.length > 0) {
    console.log("");

    for (const error of errors) {
      console.error(`[FAIL] ${error}`);
    }

    console.log("");
    console.log("RESULT: FAIL");

    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log("RESULT: PASS");
}

main()
  .catch((error) => {
    console.error("");
    console.error("[JobExpAudit] FATAL ERROR");
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });