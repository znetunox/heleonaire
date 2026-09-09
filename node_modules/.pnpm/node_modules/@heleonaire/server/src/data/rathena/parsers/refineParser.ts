import { resolveYaml } from "../importResolver";

export interface ParsedRefineChance {
  type: string;
  rate: number;
  price: number;
  material: string;
  breakingRate: number;
  downgradeAmount: number;
}

export interface ParsedRefineRule {
  group: string;
  itemLevel: number;
  refineLevel: number;

  bonus: number;
  randomBonus: number;

  blacksmithBlessingAmount: number;

  broadcastSuccess: boolean;
  broadcastFailure: boolean;

  chances: ParsedRefineChance[];
}

export interface ParsedRefineDatabase {
  rules: ParsedRefineRule[];
  duplicates: number;
}

interface RawRefineDatabase {
  Body?: RawRefineGroup[];
}

interface RawRefineGroup {
  Group?: unknown;
  Levels?: RawRefineItemLevel[];
}

interface RawRefineItemLevel {
  Level?: unknown;
  RefineLevels?: RawRefineLevel[];
}

interface RawRefineLevel {
  Level?: unknown;
  Bonus?: unknown;
  RandomBonus?: unknown;
  BlacksmithBlessingAmount?: unknown;
  BroadcastSuccess?: unknown;
  BroadcastFailure?: unknown;
  Chances?: RawRefineChance[];
}

interface RawRefineChance {
  Type?: unknown;
  Rate?: unknown;
  Price?: unknown;
  Material?: unknown;
  BreakingRate?: unknown;
  DowngradeAmount?: unknown;
}

function toNumber(
  value: unknown,
  fallback = 0
): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function toString(
  value: unknown,
  fallback = ""
): string {
  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value);
}

function toBoolean(
  value: unknown,
  fallback = false
): boolean {
  if (value === undefined || value === null) {
    return fallback;
  }

  return Boolean(value);
}

function parseRawChance(
  raw: RawRefineChance
): ParsedRefineChance {
  return {
    type: toString(raw.Type),
    rate: toNumber(raw.Rate),
    price: toNumber(raw.Price),
    material: toString(raw.Material),

    breakingRate: toNumber(
      raw.BreakingRate
    ),

    downgradeAmount: toNumber(
      raw.DowngradeAmount
    ),
  };
}

export function parseRefine(): ParsedRefineDatabase {
  console.log("[rAthena] Reading refine.yml...");

  const resolved =
    resolveYaml<RawRefineDatabase>("refine.yml");

  const groups = resolved.data.Body ?? [];

  const rules: ParsedRefineRule[] = [];
  const keys = new Set<string>();

  let duplicates = 0;

  for (const group of groups) {
    const groupName =
      toString(group.Group);

    if (!groupName) {
      console.warn(
        "[rAthena] Ignoring refine group without Group"
      );

      continue;
    }

    const levels =
      group.Levels ?? [];

    for (const itemLevel of levels) {
      const level =
        toNumber(itemLevel.Level);

      if (!level) {
        console.warn(
          `[rAthena] Ignoring refine group "${groupName}" without valid item Level`
        );

        continue;
      }

      const refineLevels =
        itemLevel.RefineLevels ?? [];

      for (const refineLevel of refineLevels) {
        const levelNumber =
          toNumber(refineLevel.Level);

        if (!levelNumber) {
          console.warn(
            `[rAthena] Ignoring refine rule "${groupName}" itemLevel=${level} without valid refine Level`
          );

          continue;
        }

        const key =
          `${groupName}:${level}:${levelNumber}`;

        if (keys.has(key)) {
          duplicates++;

          console.warn(
            `[rAthena] Duplicate refine rule: ${key}`
          );
        }

        keys.add(key);

        const chances =
          (refineLevel.Chances ?? [])
            .map(parseRawChance);

        rules.push({
          group: groupName,
          itemLevel: level,
          refineLevel: levelNumber,

          bonus: toNumber(
            refineLevel.Bonus
          ),

          randomBonus: toNumber(
            refineLevel.RandomBonus
          ),

          blacksmithBlessingAmount:
            toNumber(
              refineLevel.BlacksmithBlessingAmount
            ),

          broadcastSuccess:
            toBoolean(
              refineLevel.BroadcastSuccess
            ),

          broadcastFailure:
            toBoolean(
              refineLevel.BroadcastFailure
            ),

          chances,
        });
      }
    }
  }

  console.log(
    `[rAthena] Refine rules parsed: ${rules.length}`
  );

  console.log(
    `[rAthena] Refine duplicates: ${duplicates}`
  );

  return {
    rules,
    duplicates,
  };
}