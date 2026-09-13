import { resolveYaml } from "../importResolver";
import { RathenaMob, RathenaDropEntry } from "@heleonaire/shared";

export interface ParsedMob extends RathenaMob {}

interface RawMobEntry {
  Id: number;
  AegisName?: string;
  Name?: string;

  Level?: number;

  Hp?: number;
  Sp?: number;

  BaseExp?: number;
  JobExp?: number;

  Attack?: number;
  Attack2?: number;

    Defense?: number;
    Resistance?: number;
    MagicDefense?: number;

  Str?: number;
  Agi?: number;
  Vit?: number;
  Int?: number;
  Dex?: number;
  Luk?: number;

  AttackRange?: number;
  SkillRange?: number;
  ChaseRange?: number;

  Size?: string;
  Race?: string;
  Class?: string;
  Element?: string;
  ElementLevel?: number;

  WalkSpeed?: number;
  AttackDelay?: number;
  AttackMotion?: number;
  DamageMotion?: number;

  Ai?: string;

  Drops?: RawDropEntry[];
}

interface RawDropEntry {
  Item?: string | number;
  Rate?: number;
  StealProtected?: boolean;
}

interface MobDatabase {
  Header?: unknown;
  Body?: RawMobEntry[];
}

function toNumber(value: unknown, fallback = 0): number {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function toOptionalNumber(
  value: unknown
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
}

function toStringValue(
  value: unknown,
  fallback = ""
): string {
  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value);
}

function toOptionalString(
  value: unknown
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value);
}

function parseSize(value: unknown): RathenaMob["size"] {
  const normalized = String(value ?? "Medium");

  switch (normalized.toLowerCase()) {
    case "small":
      return "Small";

    case "large":
      return "Large";

    default:
      return "Medium";
  }
}

function parseDrops(
  drops: RawDropEntry[] | undefined
): RathenaDropEntry[] {
  if (!Array.isArray(drops)) {
    return [];
  }

  return drops
    .filter((drop) => drop.Item !== undefined)
    .map((drop) => ({
      item: String(drop.Item),
      rate: toNumber(drop.Rate),
      stealProtected: Boolean(drop.StealProtected),
    }));
}

function parseRawMob(raw: RawMobEntry): ParsedMob {
  return {
    id: toNumber(raw.Id),

    aegisName: toStringValue(raw.AegisName),
    name: toStringValue(raw.Name),

    level: toNumber(raw.Level),

    hp: toNumber(raw.Hp),
    sp: toNumber(raw.Sp),

    baseExp: toNumber(raw.BaseExp),
    jobExp: toNumber(raw.JobExp),

    attack: toNumber(raw.Attack),
    attack2: toNumber(raw.Attack2),

    defense: toNumber(raw.Defense),
    resistance: toNumber(raw.Resistance),
    magicDefense: toNumber(raw.MagicDefense),

    str: toNumber(raw.Str),
    agi: toNumber(raw.Agi),
    vit: toNumber(raw.Vit),
    int: toNumber(raw.Int),
    dex: toNumber(raw.Dex),
    luk: toNumber(raw.Luk),

    attackRange: toNumber(raw.AttackRange),
    skillRange: toNumber(raw.SkillRange),
    chaseRange: toNumber(raw.ChaseRange),

    size: parseSize(raw.Size),
    race: toStringValue(raw.Race),
    class: toStringValue(raw.Class, "Normal"),
    element: toStringValue(raw.Element),
    elementLevel: toNumber(raw.ElementLevel),

    walkSpeed: toNumber(raw.WalkSpeed),
    attackDelay: toNumber(raw.AttackDelay),
    attackMotion: toNumber(raw.AttackMotion),
    damageMotion: toNumber(raw.DamageMotion),

    ai: toStringValue(raw.Ai),

    drops: parseDrops(raw.Drops),
  };
}

export interface MobParseResult {
  mobs: Map<number, ParsedMob>;
  duplicates: number;
}

export function parseMobs(): MobParseResult {
  console.log("[rAthena] Reading mob_db.yml...");

  const resolved = resolveYaml<MobDatabase>("mob_db.yml");

  const body = Array.isArray(resolved.data)
    ? resolved.data
    : resolved.data?.Body ?? [];

  console.log(
    `[rAthena] mob_db.yml source: ${resolved.source}`
  );

  console.log(
    `[rAthena] mob_db.yml entries: ${body.length}`
  );

  const mobs = new Map<number, ParsedMob>();

  let duplicates = 0;

  for (const raw of body) {
    const mob = parseRawMob(raw);

    if (!mob.id) {
      continue;
    }

    if (mobs.has(mob.id)) {
      duplicates++;
      continue;
    }

    mobs.set(mob.id, mob);
  }

  return {
    mobs,
    duplicates,
  };
}