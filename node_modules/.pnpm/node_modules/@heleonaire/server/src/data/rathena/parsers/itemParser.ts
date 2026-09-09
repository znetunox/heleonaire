import { resolveYaml } from "../importResolver";

export interface ParsedItem {
  id: number;
  aegisName: string;
  name: string;

  type: string;
  subType?: string;

  buy: number;
  sell: number;
  weight: number;

  attack?: number;
  magicAttack?: number;
  defense?: number;
  range?: number;
  slots?: number;

  weaponLevel?: number;
  armorLevel?: number;

  equipLevelMin?: number;
  equipLevelMax?: number;

  refineable: boolean;
  gradable: boolean;

  jobs?: string;
  job?: string;
  classes?: string;
  gender?: string;
  locations?: string;

  view?: number;
  aliasName?: string;

  script?: string;
  equipScript?: string;
  unequipScript?: string;

  flags?: string;
  noUse?: string;
  trade?: string;
  stack?: string;
  delay?: string;
}

function toOptionalJson(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return JSON.stringify(value);
}

interface RawItemDatabase {
  Body?: any[];
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

function toOptionalNumber(
  value: unknown
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : undefined;
}

function toOptionalString(
  value: unknown
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
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

function parseRawItem(raw: any): ParsedItem {
  return {
    id: toNumber(raw.Id),

    aegisName: String(raw.AegisName ?? ""),
    name: String(raw.Name ?? ""),

    type: String(raw.Type ?? "Etc"),
    subType: toOptionalString(raw.SubType),

    buy: toNumber(raw.Buy),
    sell: toNumber(raw.Sell),
    weight: toNumber(raw.Weight),

    attack: toOptionalNumber(raw.Attack),
    magicAttack: toOptionalNumber(raw.MagicAttack),
    defense: toOptionalNumber(raw.Defense),
    range: toOptionalNumber(raw.Range),
    slots: toOptionalNumber(raw.Slots),

    weaponLevel: toOptionalNumber(raw.WeaponLevel),
    armorLevel: toOptionalNumber(raw.ArmorLevel),

    equipLevelMin: toOptionalNumber(raw.EquipLevelMin),
    equipLevelMax: toOptionalNumber(raw.EquipLevelMax),

    refineable: toBoolean(raw.Refineable),
    gradable: toBoolean(raw.Gradable),

    jobs: toOptionalJson(raw.Jobs),
    job: toOptionalJson(raw.Job),
    classes: toOptionalJson(raw.Classes),
    gender: toOptionalString(raw.Gender),
    locations: toOptionalJson(raw.Locations),

    view: toOptionalNumber(raw.View),

    aliasName: raw.AliasName,

    script: toOptionalString(raw.Script),
    equipScript: toOptionalString(raw.EquipScript),
    unequipScript: toOptionalString(raw.UnEquipScript),

    flags: toOptionalJson(raw.Flags),
    noUse: toOptionalJson(raw.NoUse),
    trade: toOptionalJson(raw.Trade),
    stack: toOptionalJson(raw.Stack),
    delay: toOptionalJson(raw.Delay),
  };
}


export interface ParsedItemDatabase {
  items: Map<number, ParsedItem>;
  duplicates: number;
}

export function parseItems(): ParsedItemDatabase {
  const files = [
    "item_db.yml",
    "item_db_equip.yml",
    "item_db_etc.yml",
    "item_db_usable.yml",
  ];

  const items = new Map<number, ParsedItem>();

  let duplicates = 0;

  for (const file of files) {
    console.log(`[rAthena] Reading ${file}...`);

    const resolved =
      resolveYaml<RawItemDatabase>(file);

    const entries = resolved.data.Body ?? [];

    console.log(
      `[rAthena] ${file}: ${entries.length} entries`
    );

    for (const raw of entries) {
      const item = parseRawItem(raw);

      if (!item.id) {
        console.warn(
          `[rAthena] Ignoring item without valid Id in ${file}`
        );

        continue;
      }

      if (items.has(item.id)) {
        duplicates++;
      }

      items.set(item.id, item);
    }
  }

  return {
    items,
    duplicates,
  };
}