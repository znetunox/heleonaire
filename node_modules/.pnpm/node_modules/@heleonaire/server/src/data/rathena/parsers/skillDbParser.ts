import { resolveYaml } from "../importResolver";

export interface ParsedSkillLevel {
  level: number;

  range?: number;
  hitCount?: number;
  element?: string;
  splashArea?: number;
  activeInstance?: number;
  knockback?: number;
  giveAp?: number;

  castTime?: number;
  afterCastActDelay?: number;
  afterCastWalkDelay?: number;

  duration1?: number;
  duration2?: number;

  cooldown?: number;
  fixedCastTime?: number;
}

export interface ParsedSkillRequirementItem {
  item: string;
  amount: number;
  level?: number;
}

export interface ParsedSkillRequirement {
  /**
   * null means the requirement is common to all skill levels.
   */
  level: number | null;

  hpCost: number;
  spCost: number;
  apCost: number;

  hpRateCost: number;
  spRateCost: number;
  apRateCost: number;

  maxHpTrigger: number;
  zenyCost: number;

  weapon?: string;
  ammo?: string;
  ammoAmount: number;

  state?: string;
  status?: string;

  spiritSphereCost: number;

  equipment?: string;

  itemCosts: ParsedSkillRequirementItem[];
}

export interface ParsedSkillUnitLevel {
  level: number;
  layout?: number;
  range?: number;
}

export interface ParsedSkillUnit {
  unitId: string;
  alternateId?: string;

  layout: number;
  range: number;
  interval: number;

  target?: string;
  flags?: string;
  status?: string;

  levels: ParsedSkillUnitLevel[];
}

export interface ParsedSkill {
  id: number;
  aegisName: string;

  description?: string;
  maxLevel: number;

  type?: string;
  targetType?: string;

  hit?: string;
  damageFlags?: string;
  flags?: string;

  range: number;

  castCancel: boolean;
  castDefenseReduction: number;

  castTimeFlags?: string;
  castDelayFlags?: string;

  copyFlags?: string;
  removeRequirement?: string;

  noNearNpc: boolean;
  additionalRange?: number;
  noNearNpcType?: string;

  levels: ParsedSkillLevel[];
  requirements: ParsedSkillRequirement[];
  units: ParsedSkillUnit[];

  source: "rathena";
}

interface RawSkillDbFile {
  Header?: unknown;
  Body?: unknown;
}

interface RawSkillEntry {
  Id?: unknown;
  Name?: unknown;
  Description?: unknown;
  MaxLevel?: unknown;

  Type?: unknown;
  TargetType?: unknown;

  Hit?: unknown;
  DamageFlags?: unknown;
  Flags?: unknown;

  Range?: unknown;

  CastCancel?: unknown;
  CastDefenseReduction?: unknown;

  CastTimeFlags?: unknown;
  CastDelayFlags?: unknown;

  CopyFlags?: unknown;
  RemoveRequirement?: unknown;

  NoNearNPC?: unknown;
  AdditionalRange?: unknown;

  CastTime?: unknown;
  AfterCastActDelay?: unknown;
  AfterCastWalkDelay?: unknown;

  Duration1?: unknown;
  Duration2?: unknown;

  Cooldown?: unknown;
  FixedCastTime?: unknown;

  HitCount?: unknown;
  Element?: unknown;
  SplashArea?: unknown;
  ActiveInstance?: unknown;
  Knockback?: unknown;
  GiveAp?: unknown;

  Requires?: unknown;
  Unit?: unknown;
}

/**
 * Convert arbitrary YAML values into a compact JSON string.
 *
 * Our Prisma schema stores these fields as String because rAthena
 * uses map-like structures for many flags.
 */
function serializeValue(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function asNumber(
  value: unknown,
  fallback?: number,
): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
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

function asInteger(
  value: unknown,
  fallback?: number,
): number | undefined {
  const number = asNumber(value);

  if (number === undefined) {
    return fallback;
  }

  return Math.trunc(number);
}

function asString(
  value: unknown,
  fallback?: string,
): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function asBoolean(
  value: unknown,
  fallback: boolean,
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return fallback;
}

/**
 * Returns the value associated with a specific skill level.
 *
 * rAthena supports:
 *
 *   Field: 100
 *
 * and:
 *
 *   Field:
 *     - Level: 1
 *       Value: 100
 *
 * The actual value key varies by field:
 * Time, Count, Area, Size, Max, Amount, etc.
 */
function getLevelValue(
  value: unknown,
  level: number,
  valueKeys: string[],
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const scalar = asNumber(value);

  if (scalar !== undefined) {
    return scalar;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;

    const entryLevel =
      asInteger(record.Level);

    if (entryLevel !== level) {
      continue;
    }

    for (const key of valueKeys) {
      const result =
        asNumber(record[key]);

      if (result !== undefined) {
        return result;
      }
    }
  }

  return undefined;
}

/**
 * Returns a scalar value from a level table.
 *
 * Used when a field may be:
 *
 *   SpCost: 30
 *
 * or:
 *
 *   SpCost:
 *     - Level: 1
 *       Amount: 8
 */
function getRequirementLevelValue(
  value: unknown,
  level: number,
): number {
  return (
    getLevelValue(
      value,
      level,
      ["Amount", "Value", "Cost"],
    ) ?? 0
  );
}

function hasLevelEntries(
  value: unknown,
): boolean {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.some(
    entry =>
      entry &&
      typeof entry === "object" &&
      asInteger(
        (entry as Record<string, unknown>).Level,
      ) !== undefined,
  );
}

function parseSkillLevels(
  raw: RawSkillEntry,
): ParsedSkillLevel[] {
  const maxLevel =
    asInteger(raw.MaxLevel, 1) ?? 1;

  const levels: ParsedSkillLevel[] = [];

  for (let level = 1; level <= maxLevel; level++) {
    const parsed: ParsedSkillLevel = {
      level,
    };

    const range =
      getLevelValue(
        raw.Range,
        level,
        ["Size", "Range", "Value"],
      );

    if (range !== undefined) {
      parsed.range = range;
    }

    const hitCount =
      getLevelValue(
        raw.HitCount,
        level,
        ["Count", "Amount", "Value"],
      );

    if (hitCount !== undefined) {
      parsed.hitCount = hitCount;
    }

    const splashArea =
      getLevelValue(
        raw.SplashArea,
        level,
        ["Area", "Size", "Value"],
      );

    if (splashArea !== undefined) {
      parsed.splashArea = splashArea;
    }

    const activeInstance =
      getLevelValue(
        raw.ActiveInstance,
        level,
        ["Max", "Amount", "Value"],
      );

    if (activeInstance !== undefined) {
      parsed.activeInstance =
        activeInstance;
    }

    const knockback =
      getLevelValue(
        raw.Knockback,
        level,
        ["Amount", "Value"],
      );

    if (knockback !== undefined) {
      parsed.knockback = knockback;
    }

    const giveAp =
      getLevelValue(
        raw.GiveAp,
        level,
        ["Amount", "Value"],
      );

    if (giveAp !== undefined) {
      parsed.giveAp = giveAp;
    }

    const castTime =
      getLevelValue(
        raw.CastTime,
        level,
        ["Time", "Amount", "Value"],
      );

    if (castTime !== undefined) {
      parsed.castTime = castTime;
    }

    const afterCastActDelay =
      getLevelValue(
        raw.AfterCastActDelay,
        level,
        ["Time", "Amount", "Value"],
      );

    if (afterCastActDelay !== undefined) {
      parsed.afterCastActDelay =
        afterCastActDelay;
    }

    const afterCastWalkDelay =
      getLevelValue(
        raw.AfterCastWalkDelay,
        level,
        ["Time", "Amount", "Value"],
      );

    if (afterCastWalkDelay !== undefined) {
      parsed.afterCastWalkDelay =
        afterCastWalkDelay;
    }

    const duration1 =
      getLevelValue(
        raw.Duration1,
        level,
        ["Time", "Amount", "Value"],
      );

    if (duration1 !== undefined) {
      parsed.duration1 = duration1;
    }

    const duration2 =
      getLevelValue(
        raw.Duration2,
        level,
        ["Time", "Amount", "Value"],
      );

    if (duration2 !== undefined) {
      parsed.duration2 = duration2;
    }

    const cooldown =
      getLevelValue(
        raw.Cooldown,
        level,
        ["Time", "Amount", "Value"],
      );

    if (cooldown !== undefined) {
      parsed.cooldown = cooldown;
    }

    const fixedCastTime =
      getLevelValue(
        raw.FixedCastTime,
        level,
        ["Time", "Amount", "Value"],
      );

    if (fixedCastTime !== undefined) {
      parsed.fixedCastTime =
        fixedCastTime;
    }

    const element =
      getLevelString(
        raw.Element,
        level,
      );

    if (element !== undefined) {
      parsed.element = element;
    }

    // Do not create empty level rows unnecessarily.
    if (
      Object.keys(parsed).length > 1
    ) {
      levels.push(parsed);
    }
  }

  return levels;
}

function getLevelString(
  value: unknown,
  level: number,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const scalar =
    asString(value);

  if (scalar !== undefined) {
    return scalar;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record =
      entry as Record<string, unknown>;

    if (
      asInteger(record.Level) !== level
    ) {
      continue;
    }

    for (const key of [
      "Element",
      "Value",
    ]) {
      const result =
        asString(record[key]);

      if (result !== undefined) {
        return result;
      }
    }
  }

  return undefined;
}

function parseItemCosts(
  value: unknown,
): ParsedSkillRequirementItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: ParsedSkillRequirementItem[] = [];

  for (const rawItem of value) {
    if (
      !rawItem ||
      typeof rawItem !== "object"
    ) {
      continue;
    }

    const item =
      rawItem as Record<string, unknown>;

    const name =
      asString(item.Item);

    if (!name) {
      continue;
    }

    const amount =
      asInteger(item.Amount, 1) ?? 1;

    const level =
      asInteger(item.Level);

    result.push({
      item: name,
      amount,
      ...(level !== undefined
        ? { level }
        : {}),
    });
  }

  return result;
}

function parseRequirements(
  raw: RawSkillEntry,
): ParsedSkillRequirement[] {
  if (
    !raw.Requires ||
    typeof raw.Requires !== "object"
  ) {
    return [];
  }

  const requires =
    raw.Requires as Record<string, unknown>;

  const levelFields = [
    requires.HpCost,
    requires.SpCost,
    requires.ApCost,
    requires.HpRateCost,
    requires.SpRateCost,
    requires.ApRateCost,
    requires.MaxHpTrigger,
    requires.ZenyCost,
    requires.AmmoAmount,
    requires.SpiritSphereCost,
  ];

  const hasPerLevelValues =
    levelFields.some(hasLevelEntries);

  const maxLevel =
    asInteger(raw.MaxLevel, 1) ?? 1;

  const itemCosts =
    parseItemCosts(
      requires.ItemCost,
    );

  const result: ParsedSkillRequirement[] = [];

  if (hasPerLevelValues) {
    for (
      let level = 1;
      level <= maxLevel;
      level++
    ) {
      result.push(
        createRequirement(
          requires,
          level,
          itemCosts,
        ),
      );
    }

    return result;
  }

  result.push(
    createRequirement(
      requires,
      null,
      itemCosts,
    ),
  );

  return result;
}

function createRequirement(
  requires: Record<string, unknown>,
  level: number | null,
  itemCosts: ParsedSkillRequirementItem[],
): ParsedSkillRequirement {
  const getValue = (
    field: string,
  ): number => {
    const value =
      requires[field];

    if (level === null) {
      return (
        asInteger(value, 0) ?? 0
      );
    }

    return getRequirementLevelValue(
      value,
      level,
    );
  };

  return {
    level,

    hpCost:
      getValue("HpCost"),

    spCost:
      getValue("SpCost"),

    apCost:
      getValue("ApCost"),

    hpRateCost:
      getValue("HpRateCost"),

    spRateCost:
      getValue("SpRateCost"),

    apRateCost:
      getValue("ApRateCost"),

    maxHpTrigger:
      getValue("MaxHpTrigger"),

    zenyCost:
      getValue("ZenyCost"),

    weapon:
      serializeValue(
        requires.Weapon,
      ),

    ammo:
      asString(
        requires.Ammo,
      ),

    ammoAmount:
      getValue("AmmoAmount"),

    state:
      asString(
        requires.State,
      ),

    status:
      asString(
        requires.Status,
      ),

    spiritSphereCost:
      getValue(
        "SpiritSphereCost",
      ),

    equipment:
      asString(
        requires.Equipment,
      ),

    itemCosts,
  };
}

function parseUnit(
  raw: unknown,
): ParsedSkillUnit | undefined {
  if (
    !raw ||
    typeof raw !== "object"
  ) {
    return undefined;
  }

  const unit =
    raw as Record<string, unknown>;

  const unitId =
    asString(unit.Id);

  if (!unitId) {
    return undefined;
  }

  const levels =
    parseUnitLevels(
      unit.Layout,
      unit.Range,
    );

  return {
    unitId,

    alternateId:
      asString(
        unit.AlternateId,
      ),

    layout:
      asInteger(
        unit.Layout,
        0,
      ) ?? 0,

    range:
      asInteger(
        unit.Range,
        0,
      ) ?? 0,

    interval:
      asInteger(
        unit.Interval,
        0,
      ) ?? 0,

    target:
      asString(
        unit.Target,
      ),

    flags:
      serializeValue(
        unit.Flag,
      ),

    status:
      asString(
        unit.Status,
      ),

    levels,
  };
}

function parseUnitLevels(
  layout: unknown,
  range: unknown,
): ParsedSkillUnitLevel[] {
  const levels: ParsedSkillUnitLevel[] = [];

  const hasLevels =
    hasLevelEntries(layout) ||
    hasLevelEntries(range);

  if (!hasLevels) {
    return levels;
  }

  const maxLevel = Math.max(
    getMaxLevelFromEntries(layout),
    getMaxLevelFromEntries(range),
  );

  for (
    let level = 1;
    level <= maxLevel;
    level++
  ) {
    const parsed: ParsedSkillUnitLevel = {
      level,
    };

    const layoutValue =
      getLevelValue(
        layout,
        level,
        ["Size", "Area", "Value"],
      );

    if (layoutValue !== undefined) {
      parsed.layout =
        layoutValue;
    }

    const rangeValue =
      getLevelValue(
        range,
        level,
        ["Size", "Range", "Value"],
      );

    if (rangeValue !== undefined) {
      parsed.range =
        rangeValue;
    }

    if (
      Object.keys(parsed).length > 1
    ) {
      levels.push(parsed);
    }
  }

  return levels;
}

function getMaxLevelFromEntries(
  value: unknown,
): number {
  if (!Array.isArray(value)) {
    return 0;
  }

  let max = 0;

  for (const entry of value) {
    if (
      !entry ||
      typeof entry !== "object"
    ) {
      continue;
    }

    const level =
      asInteger(
        (entry as Record<string, unknown>)
          .Level,
      );

    if (
      level !== undefined &&
      level > max
    ) {
      max = level;
    }
  }

  return max;
}

function parseUnits(
  raw: RawSkillEntry,
): ParsedSkillUnit[] {
  if (!raw.Unit) {
    return [];
  }

  if (Array.isArray(raw.Unit)) {
    return raw.Unit
      .map(parseUnit)
      .filter(
        (
          unit,
        ): unit is ParsedSkillUnit =>
          unit !== undefined,
      );
  }

  const unit =
    parseUnit(raw.Unit);

  return unit ? [unit] : [];
}

function parseSkill(
  raw: unknown,
): ParsedSkill | undefined {
  if (
    !raw ||
    typeof raw !== "object"
  ) {
    return undefined;
  }

  const entry =
    raw as RawSkillEntry;

  const id =
    asInteger(entry.Id);

  const name =
    asString(entry.Name);

  if (
    id === undefined ||
    !name
  ) {
    return undefined;
  }

  const maxLevel =
    asInteger(
      entry.MaxLevel,
      1,
    ) ?? 1;

  return {
    id,
    aegisName: name,

    description:
      asString(
        entry.Description,
      ),

    maxLevel,

    type:
      asString(
        entry.Type,
      ),

    targetType:
      asString(
        entry.TargetType,
      ),

    hit:
      asString(
        entry.Hit,
      ),

    damageFlags:
      serializeValue(
        entry.DamageFlags,
      ),

    flags:
      serializeValue(
        entry.Flags,
      ),

    range:
      asInteger(
        entry.Range,
        0,
      ) ?? 0,

    castCancel:
      asBoolean(
        entry.CastCancel,
        true,
      ),

    castDefenseReduction:
      asInteger(
        entry.CastDefenseReduction,
        0,
      ) ?? 0,

    castTimeFlags:
      serializeValue(
        entry.CastTimeFlags,
      ),

    castDelayFlags:
      serializeValue(
        entry.CastDelayFlags,
      ),

    copyFlags:
      serializeValue(
        entry.CopyFlags,
      ),

    removeRequirement:
      serializeValue(
        entry.RemoveRequirement,
      ),

    noNearNpc:
      entry.NoNearNPC !== undefined,

    additionalRange:
      asInteger(
        entry.AdditionalRange,
      ),

    noNearNpcType:
      entry.NoNearNPC &&
      typeof entry.NoNearNPC === "object"
        ? asString(
            (
              entry.NoNearNPC as Record<
                string,
                unknown
              >
            ).Type,
          )
        : undefined,

    levels:
      parseSkillLevels(entry),

    requirements:
      parseRequirements(entry),

    units:
      parseUnits(entry),

    source: "rathena",
  };
}

/**
 * Parse the complete rAthena skill_db.yml.
 */
export function parseSkillDbDefinitions(): ParsedSkill[] {
  console.log(
    "[rAthena] Reading skill_db.yml...",
  );

  const resolved =
    resolveYaml<RawSkillDbFile>(
      "skill_db.yml",
    );

  console.log(
    `[rAthena] skill_db.yml source: ${resolved.source}`,
  );

  const body =
    Array.isArray(resolved.data?.Body)
      ? resolved.data.Body
      : [];

  console.log(
    `[rAthena] skill_db.yml entries: ${body.length}`,
  );

  const skills: ParsedSkill[] = [];

  for (const rawSkill of body) {
    const skill =
      parseSkill(rawSkill);

    if (!skill) {
      console.warn(
        "[rAthena] Invalid skill_db entry.",
      );

      continue;
    }

    skills.push(skill);
  }

  return skills;
}

export interface SkillDbParseResult {
  skills: ParsedSkill[];
  duplicates: number;
}

/**
 * Parse and validate the complete skill database.
 */
export function parseSkillDb(): SkillDbParseResult {
  const parsed =
    parseSkillDbDefinitions();

  const unique =
    new Map<number, ParsedSkill>();

  let duplicates = 0;

  for (const skill of parsed) {
    if (unique.has(skill.id)) {
      duplicates++;

      console.warn(
        `[rAthena] Duplicate skill ID: ${skill.id} (${skill.aegisName})`,
      );

      continue;
    }

    unique.set(
      skill.id,
      skill,
    );
  }

  const skills =
    Array.from(
      unique.values(),
    );

  console.log(
    `[rAthena] skills parsed: ${skills.length}`,
  );

  console.log(
    `[rAthena] skill duplicates: ${duplicates}`,
  );

  return {
    skills,
    duplicates,
  };
}