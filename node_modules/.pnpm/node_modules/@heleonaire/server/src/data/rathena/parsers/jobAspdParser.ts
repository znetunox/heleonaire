import { resolveYaml } from "../importResolver";

export interface ParsedJobAspdGroup {
  jobs: string[];
  baseASPD: Map<string, number>;
}

interface RawJobAspdGroup {
  Jobs?: Record<string, boolean>;
  BaseASPD?: Record<string, number>;
}

interface JobAspdDatabase {
  Header?: unknown;
  Body?: RawJobAspdGroup[];
}

function toNumber(
  value: unknown,
  fallback = 0
): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function parseJobs(
  jobs?: Record<string, boolean>
): string[] {
  if (!jobs || typeof jobs !== "object") {
    return [];
  }

  return Object.entries(jobs)
    .filter(([, enabled]) => enabled === true)
    .map(([name]) => name);
}

function parseBaseASPD(
  value?: Record<string, number>
): Map<string, number> {
  const result =
    new Map<string, number>();

  if (!value || typeof value !== "object") {
    return result;
  }

  for (const [
    weaponType,
    rawValue,
  ] of Object.entries(value)) {
    const aspd = toNumber(rawValue);

    if (aspd > 0) {
      result.set(
        weaponType,
        aspd
      );
    }
  }

  return result;
}

export interface JobAspdParseResult {
  groups: ParsedJobAspdGroup[];
}

export function parseJobAspd():
  JobAspdParseResult {
  console.log(
    "[rAthena] Reading job_aspd.yml..."
  );

  const resolved =
    resolveYaml<JobAspdDatabase>(
      "job_aspd.yml"
    );

  const body = Array.isArray(resolved.data)
    ? resolved.data
    : resolved.data?.Body ?? [];

  const groups: ParsedJobAspdGroup[] = [];

  for (const raw of body) {
    if (!raw || typeof raw !== "object") {
      continue;
    }

    const jobs =
      parseJobs(raw.Jobs);

    if (jobs.length === 0) {
      continue;
    }

    groups.push({
      jobs,
      baseASPD: parseBaseASPD(
        raw.BaseASPD
      ),
    });
  }

  console.log(
    `[rAthena] job_aspd.yml source: ${resolved.source}`
  );

  console.log(
    `[rAthena] job_aspd.yml groups: ${groups.length}`
  );

  const jobs = new Set<string>();

  let aspdEntries = 0;

  for (const group of groups) {
    for (const job of group.jobs) {
      jobs.add(job);
    }

    aspdEntries +=
      group.baseASPD.size;
  }

  console.log(
    `[rAthena] job_aspd.yml unique jobs: ${jobs.size}`
  );

  console.log(
    `[rAthena] job_aspd.yml ASPD entries: ${aspdEntries}`
  );

  return {
    groups,
  };
}