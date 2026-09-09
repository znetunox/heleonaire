import { normalizeJobName } from "../jobName";
import {
  parseJobs,
  ParsedJob,
} from "./jobParser";
import {
  parseJobStats,
} from "./jobStatsParser";
import {
  parseSkillTree,
  ParsedSkillTreeJob,
} from "./skillTreeParser";

export interface ParsedJobHierarchy {
  id: number;
  job: string;

  /**
   * Job stats group from job_stats.yml.
   *
   * This is NOT the parent job.
   */
  statsGroup?: number;

  /**
   * Skill-tree inheritance.
   *
   * This is NOT automatically the parent job.
   */
  skillInheritance: string[];

  /**
   * Candidate immediate parent inferred from
   * the skill inheritance chain.
   *
   * This field is only an audit result.
   */
  candidateParent?: string;
}

export interface JobHierarchyAuditResult {
  jobs: ParsedJobHierarchy[];
  missingStats: string[];
  missingSkillTree: string[];
  ambiguousParents: string[];
}

/**
 * Technical jobs that should not become normal
 * playable GameClass records.
 *
 * These are enum markers or server/internal jobs.
 */
const TECHNICAL_JOBS = new Set([
  "MAX_BASIC",

  "SECOND_JOB_START",
  "SECOND_JOB_END",
  "MAX",

  "RUNE_KNIGHT_2ND",
  "MECHANIC_2ND",
  "GUILLOTINE_CROSS_2ND",
  "WARLOCK_2ND",
  "ARCHBISHOP_2ND",
  "RANGER_2ND",
  "ROYAL_GUARD_2ND",
  "GENETIC_2ND",
  "SHADOW_CHASER_2ND",
  "SORCERER_2ND",
  "SURA_2ND",
  "MINSTREL_2ND",
  "WANDERER_2ND",
]);

/**
 * Special event / non-standard jobs.
 *
 * They are kept in the audit but excluded from
 * normal playable class hierarchy resolution.
 */
const SPECIAL_JOBS = new Set([
  "WEDDING",
  "XMAS",
  "SUMMER",
  "HANBOK",
  "OKTOBERFEST",
  "SUMMER2",
  "GANGSI",
  "DEATH_KNIGHT",
  "DARK_COLLECTOR",
]);

function isTechnicalOrSpecial(job: string): boolean {
  return (
    TECHNICAL_JOBS.has(job) ||
    SPECIAL_JOBS.has(job)
  );
}

/**
 * Return the deepest inheritance candidate.
 *
 * Example:
 *
 * KNIGHT
 *   NOVICE
 *   SWORDMAN
 *
 * -> SWORDMAN
 *
 * LORD_KNIGHT
 *   NOVICE
 *   SWORDMAN
 *   KNIGHT
 *
 * -> KNIGHT
 *
 * This is only a candidate.
 *
 * We intentionally do not write this directly
 * into Prisma.
 */
function inferCandidateParent(
  job: ParsedSkillTreeJob,
  skillTreeMap: Map<string, ParsedSkillTreeJob>,
): {
  candidate?: string;
  ambiguous: boolean;
} {
  const validInheritedJobs =
    job.inherits.filter(
      inherited =>
        !isTechnicalOrSpecial(inherited)
    );

  if (
    validInheritedJobs.length === 0
  ) {
    return {
      candidate: undefined,
      ambiguous: false,
    };
  }

  /**
   * A direct parent candidate should be an
   * inherited job that is itself present in
   * the skill tree.
   */
  const candidates =
    validInheritedJobs.filter(
      inherited =>
        skillTreeMap.has(inherited)
    );

  if (candidates.length === 0) {
    return {
      candidate: undefined,
      ambiguous: false,
    };
  }

  /**
   * Find the candidate with the deepest
   * inheritance chain.
   *
   * This helps distinguish:
   *
   * NOVICE
   * SWORDMAN
   * KNIGHT
   *
   * from simply choosing the last YAML entry.
   */
  let deepestCandidate:
    | string
    | undefined;

  let deepestDepth = -1;

  let ambiguous = false;

  for (const candidate of candidates) {
    const candidateJob =
      skillTreeMap.get(candidate);

    if (!candidateJob) {
      continue;
    }

    const depth =
      candidateJob.inherits.length;

    if (depth > deepestDepth) {
      deepestDepth = depth;
      deepestCandidate = candidate;
      ambiguous = false;
    } else if (
      depth === deepestDepth &&
      candidate !== deepestCandidate
    ) {
      ambiguous = true;
    }
  }

  return {
    candidate: deepestCandidate,
    ambiguous,
  };
}

export function parseJobHierarchy(): JobHierarchyAuditResult {
  console.log(
    "[rAthena] Building job hierarchy audit..."
  );

  const jobResult =
    parseJobs();

  const statsResult =
    parseJobStats();

  const skillTreeResult =
    parseSkillTree();

  // ---------------------------------------------------------
  // mmo.hpp
  // ---------------------------------------------------------

  const jobsByName =
    new Map<string, ParsedJob>();

  for (const job of jobResult.jobs) {
    jobsByName.set(
      normalizeJobName(job.aegisName),
      job
    );
  }

  // ---------------------------------------------------------
  // job_stats.yml
  // ---------------------------------------------------------

  const statsGroupByJob =
    new Map<string, number>();

  statsResult.groups.forEach(
    (group, index) => {
      const groupId = index + 1;

      for (const jobName of group.jobs) {
        statsGroupByJob.set(
          normalizeJobName(jobName),
          groupId
        );
      }
    }
  );

  // ---------------------------------------------------------
  // skill_tree.yml
  // ---------------------------------------------------------

  const skillTreeByJob =
    new Map<string, ParsedSkillTreeJob>();

  for (
    const job of skillTreeResult.jobs
  ) {
    const normalized =
      normalizeJobName(job.job);

    skillTreeByJob.set(
      normalized,
      {
        ...job,
        job: normalized,
        inherits: job.inherits.map(
          normalizeJobName
        ),
      }
    );
  }

  // ---------------------------------------------------------
  // Build audit
  // ---------------------------------------------------------

  const hierarchy: ParsedJobHierarchy[] =
    [];

  const missingStats: string[] = [];
  const missingSkillTree: string[] = [];
  const ambiguousParents: string[] = [];

  for (const job of jobResult.jobs) {
    const normalized =
      normalizeJobName(job.aegisName);

    const skillTreeJob =
      skillTreeByJob.get(normalized);

    const statsGroup =
      statsGroupByJob.get(normalized);

    if (
      !statsGroup &&
      !isTechnicalOrSpecial(normalized)
    ) {
      missingStats.push(normalized);
    }

    if (
      !skillTreeJob &&
      !isTechnicalOrSpecial(normalized)
    ) {
      missingSkillTree.push(normalized);
    }

    let candidateParent:
      | string
      | undefined;

    if (skillTreeJob) {
      const result =
        inferCandidateParent(
          skillTreeJob,
          skillTreeByJob
        );

      candidateParent =
        result.candidate;

      if (result.ambiguous) {
        ambiguousParents.push(
          normalized
        );
      }
    }

    hierarchy.push({
      id: job.id,
      job: normalized,
      statsGroup,
      skillInheritance:
        skillTreeJob?.inherits ?? [],
      candidateParent,
    });
  }

  return {
    jobs: hierarchy,
    missingStats,
    missingSkillTree,
    ambiguousParents,
  };
}