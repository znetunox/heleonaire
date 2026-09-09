import { resolveYaml } from "../importResolver";

export interface ParsedJobStatGroup {
  jobs: string[];

  maxWeight?: number;

  hpFactor?: number;
  hpIncrease?: number;

  spFactor?: number;
  spIncrease?: number;

  apFactor?: number;
  apIncrease?: number;

  baseASPD: Map<string, number>;

  bonusStats: ParsedBonusStat[];

  maxStats: Record<string, number>;

  baseExp: ParsedExpEntry[];
  jobExp: ParsedExpEntry[];

  baseHp: ParsedHpEntry[];
  baseSp: ParsedSpEntry[];
  baseAp: ParsedApEntry[];
}

export interface ParsedBonusStat {
  level: number;

  str?: number;
  agi?: number;
  vit?: number;
  int?: number;
  dex?: number;
  luk?: number;

  pow?: number;
  sta?: number;
  wis?: number;
  spl?: number;
  con?: number;
  crt?: number;
}

export interface ParsedExpEntry {
  level: number;
  exp: number;
}

export interface ParsedHpEntry {
  level: number;
  hp: number;
}

export interface ParsedSpEntry {
  level: number;
  sp: number;
}

export interface ParsedApEntry {
  level: number;
  ap: number;
}

interface RawJobStats {
  Jobs?: Record<string, boolean>;

  MaxWeight?: number;

  HpFactor?: number;
  HpIncrease?: number;

  SpFactor?: number;
  SpIncrease?: number;

  ApFactor?: number;
  ApIncrease?: number;

  BaseASPD?: Record<string, number>;

  BonusStats?: RawBonusStat[];

  MaxStats?: Record<string, number>;

  BaseExp?: RawExpEntry[];

  JobExp?: RawExpEntry[];

  BaseHp?: RawHpEntry[];

  BaseSp?: RawSpEntry[];

  BaseAp?: RawApEntry[];
}

interface RawBonusStat {
  Level?: number;

  Str?: number;
  Agi?: number;
  Vit?: number;
  Int?: number;
  Dex?: number;
  Luk?: number;

  Pow?: number;
  Sta?: number;
  Wis?: number;
  Spl?: number;
  Con?: number;
  Crt?: number;
}

interface RawExpEntry {
  Level?: number;
  Exp?: number;
}

interface RawHpEntry {
  Level?: number;
  Hp?: number;
}

interface RawSpEntry {
  Level?: number;
  Sp?: number;
}

interface RawApEntry {
  Level?: number;
  Ap?: number;
}

interface JobStatsDatabase {
  Header?: unknown;
  Body?: RawJobStats[];
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

function parseNumberMap(
  value?: Record<string, number>
): Record<string, number> {
  if (!value || typeof value !== "object") {
    return {};
  }

  const result: Record<string, number> = {};

  for (const [key, rawValue] of Object.entries(value)) {
    const parsed = Number(rawValue);

    if (Number.isFinite(parsed)) {
      result[key] = parsed;
    }
  }

  return result;
}

function parseBonusStats(
  entries?: RawBonusStat[]
): ParsedBonusStat[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => ({
      level: toNumber(entry.Level),

      str: toOptionalNumber(entry.Str),
      agi: toOptionalNumber(entry.Agi),
      vit: toOptionalNumber(entry.Vit),
      int: toOptionalNumber(entry.Int),
      dex: toOptionalNumber(entry.Dex),
      luk: toOptionalNumber(entry.Luk),

      pow: toOptionalNumber(entry.Pow),
      sta: toOptionalNumber(entry.Sta),
      wis: toOptionalNumber(entry.Wis),
      spl: toOptionalNumber(entry.Spl),
      con: toOptionalNumber(entry.Con),
      crt: toOptionalNumber(entry.Crt),
    }))
    .filter((entry) => entry.level > 0);
}

function parseExpTable(
  entries?: RawExpEntry[]
): ParsedExpEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => ({
      level: toNumber(entry.Level),
      exp: toNumber(entry.Exp),
    }))
    .filter((entry) => entry.level > 0);
}

function parseHpTable(
  entries?: RawHpEntry[]
): ParsedHpEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => ({
      level: toNumber(entry.Level),
      hp: toNumber(entry.Hp),
    }))
    .filter((entry) => entry.level > 0);
}

function parseSpTable(
  entries?: RawSpEntry[]
): ParsedSpEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => ({
      level: toNumber(entry.Level),
      sp: toNumber(entry.Sp),
    }))
    .filter((entry) => entry.level > 0);
}

function parseApTable(
  entries?: RawApEntry[]
): ParsedApEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => ({
      level: toNumber(entry.Level),
      ap: toNumber(entry.Ap),
    }))
    .filter((entry) => entry.level > 0);
}

function parseRawGroup(
  raw: RawJobStats
): ParsedJobStatGroup {
  const baseASPD = new Map<string, number>();

  if (raw.BaseASPD) {
    for (const [weaponType, value] of Object.entries(
      raw.BaseASPD
    )) {
      baseASPD.set(
        weaponType,
        toNumber(value)
      );
    }
  }

  return {
    jobs: parseJobs(raw.Jobs),

    maxWeight: toOptionalNumber(
      raw.MaxWeight
    ),

    hpFactor: toOptionalNumber(
      raw.HpFactor
    ),

    hpIncrease: toOptionalNumber(
      raw.HpIncrease
    ),

    spFactor: toOptionalNumber(
      raw.SpFactor
    ),

    spIncrease: toOptionalNumber(
      raw.SpIncrease
    ),

    apFactor: toOptionalNumber(
      raw.ApFactor
    ),

    apIncrease: toOptionalNumber(
      raw.ApIncrease
    ),

    baseASPD,

    bonusStats: parseBonusStats(
      raw.BonusStats
    ),

    maxStats: parseNumberMap(
      raw.MaxStats
    ),

    baseExp: parseExpTable(
      raw.BaseExp
    ),

    jobExp: parseExpTable(
      raw.JobExp
    ),

    baseHp: parseHpTable(
      raw.BaseHp
    ),

    baseSp: parseSpTable(
      raw.BaseSp
    ),

    baseAp: parseApTable(
      raw.BaseAp
    ),
  };
}

export interface JobStatsParseResult {
  groups: ParsedJobStatGroup[];
}

export function parseJobStats(): JobStatsParseResult {
  console.log(
    "[rAthena] Reading job_stats.yml..."
  );

  const resolved =
    resolveYaml<JobStatsDatabase>(
      "job_stats.yml"
    );

  const body = Array.isArray(resolved.data)
    ? resolved.data
    : resolved.data?.Body ?? [];

  const groups: ParsedJobStatGroup[] = [];

  for (const raw of body) {
    const group = parseRawGroup(raw);

    if (group.jobs.length === 0) {
      continue;
    }

    groups.push(group);
  }

  console.log(
    `[rAthena] job_stats.yml source: ${resolved.source}`
  );

  console.log(
    `[rAthena] job_stats.yml groups: ${groups.length}`
  );

  return {
    groups,
  };
}