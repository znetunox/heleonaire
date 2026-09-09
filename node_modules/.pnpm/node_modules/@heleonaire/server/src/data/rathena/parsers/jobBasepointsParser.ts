import { resolveYaml } from "../importResolver";

export interface ParsedJobBasePoint {
  level: number;
  points: number;
}

interface RawJobBasePoint {
  Level?: number;
  Points?: number;
}

interface JobBasepointsDatabase {
  Header?: unknown;
  Body?: RawJobBasePoint[];
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

function parseEntries(
  entries?: RawJobBasePoint[]
): ParsedJobBasePoint[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => ({
      level: toNumber(entry.Level),
      points: toNumber(entry.Points),
    }))
    .filter((entry) => entry.level > 0);
}

export interface JobBasepointsParseResult {
  entries: ParsedJobBasePoint[];
}

export function parseJobBasepoints():
  JobBasepointsParseResult {
  console.log(
    "[rAthena] Reading job_basepoints.yml..."
  );

  const resolved =
    resolveYaml<JobBasepointsDatabase>(
      "job_basepoints.yml"
    );

  const body = Array.isArray(resolved.data)
    ? resolved.data
    : resolved.data?.Body ?? [];

  const entries =
    parseEntries(body);

  console.log(
    `[rAthena] job_basepoints.yml source: ${resolved.source}`
  );

  console.log(
    `[rAthena] job_basepoints.yml entries: ${entries.length}`
  );

  return {
    entries,
  };
}