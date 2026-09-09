import { resolveYaml } from "../importResolver";

export interface ParsedStatPoint {
  level: number;
  points: number;
  traitPoints?: number;
}

interface RawStatPoint {
  Level?: number;
  Points?: number;
  TraitPoints?: number;
}

interface StatPointDatabase {
  Header?: unknown;
  Body?: RawStatPoint[];
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

function toOptionalNumber(
  value: unknown
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
}

export interface StatPointParseResult {
  entries: ParsedStatPoint[];
}

export function parseStatPoints():
  StatPointParseResult {
  console.log(
    "[rAthena] Reading statpoint.yml..."
  );

  const resolved =
    resolveYaml<StatPointDatabase>(
      "statpoint.yml"
    );

  const body = Array.isArray(resolved.data)
    ? resolved.data
    : resolved.data?.Body ?? [];

  const entries: ParsedStatPoint[] = [];

  for (const raw of body) {
    if (!raw || typeof raw !== "object") {
      continue;
    }

    const level = toNumber(raw.Level);

    if (level <= 0) {
      continue;
    }

    entries.push({
      level,
      points: toNumber(raw.Points),
      traitPoints: toOptionalNumber(
        raw.TraitPoints
      ),
    });
  }

  console.log(
    `[rAthena] statpoint.yml source: ${resolved.source}`
  );

  console.log(
    `[rAthena] statpoint.yml entries: ${entries.length}`
  );

  return {
    entries,
  };
}