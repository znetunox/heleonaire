import { resolveYaml } from "../importResolver";
/**
 * Convert arbitrary YAML values into a compact JSON string.
 *
 * Our Prisma schema stores these fields as String because rAthena
 * uses map-like structures for many flags.
 */
function serializeValue(value) {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value === "string") {
        return value;
    }
    return JSON.stringify(value);
}
function asNumber(value, fallback) {
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
function asInteger(value, fallback) {
    const number = asNumber(value);
    if (number === undefined) {
        return fallback;
    }
    return Math.trunc(number);
}
function asString(value, fallback) {
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    return fallback;
}
function asBoolean(value, fallback) {
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
function getLevelValue(value, level, valueKeys) {
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
        const record = entry;
        const entryLevel = asInteger(record.Level);
        if (entryLevel !== level) {
            continue;
        }
        for (const key of valueKeys) {
            const result = asNumber(record[key]);
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
function getRequirementLevelValue(value, level) {
    return (getLevelValue(value, level, ["Amount", "Value", "Cost"]) ?? 0);
}
function hasLevelEntries(value) {
    if (!Array.isArray(value)) {
        return false;
    }
    return value.some(entry => entry &&
        typeof entry === "object" &&
        asInteger(entry.Level) !== undefined);
}
function parseSkillLevels(raw) {
    const maxLevel = asInteger(raw.MaxLevel, 1) ?? 1;
    const levels = [];
    for (let level = 1; level <= maxLevel; level++) {
        const parsed = {
            level,
        };
        const range = getLevelValue(raw.Range, level, ["Size", "Range", "Value"]);
        if (range !== undefined) {
            parsed.range = range;
        }
        const hitCount = getLevelValue(raw.HitCount, level, ["Count", "Amount", "Value"]);
        if (hitCount !== undefined) {
            parsed.hitCount = hitCount;
        }
        const splashArea = getLevelValue(raw.SplashArea, level, ["Area", "Size", "Value"]);
        if (splashArea !== undefined) {
            parsed.splashArea = splashArea;
        }
        const activeInstance = getLevelValue(raw.ActiveInstance, level, ["Max", "Amount", "Value"]);
        if (activeInstance !== undefined) {
            parsed.activeInstance =
                activeInstance;
        }
        const knockback = getLevelValue(raw.Knockback, level, ["Amount", "Value"]);
        if (knockback !== undefined) {
            parsed.knockback = knockback;
        }
        const giveAp = getLevelValue(raw.GiveAp, level, ["Amount", "Value"]);
        if (giveAp !== undefined) {
            parsed.giveAp = giveAp;
        }
        const castTime = getLevelValue(raw.CastTime, level, ["Time", "Amount", "Value"]);
        if (castTime !== undefined) {
            parsed.castTime = castTime;
        }
        const afterCastActDelay = getLevelValue(raw.AfterCastActDelay, level, ["Time", "Amount", "Value"]);
        if (afterCastActDelay !== undefined) {
            parsed.afterCastActDelay =
                afterCastActDelay;
        }
        const afterCastWalkDelay = getLevelValue(raw.AfterCastWalkDelay, level, ["Time", "Amount", "Value"]);
        if (afterCastWalkDelay !== undefined) {
            parsed.afterCastWalkDelay =
                afterCastWalkDelay;
        }
        const duration1 = getLevelValue(raw.Duration1, level, ["Time", "Amount", "Value"]);
        if (duration1 !== undefined) {
            parsed.duration1 = duration1;
        }
        const duration2 = getLevelValue(raw.Duration2, level, ["Time", "Amount", "Value"]);
        if (duration2 !== undefined) {
            parsed.duration2 = duration2;
        }
        const cooldown = getLevelValue(raw.Cooldown, level, ["Time", "Amount", "Value"]);
        if (cooldown !== undefined) {
            parsed.cooldown = cooldown;
        }
        const fixedCastTime = getLevelValue(raw.FixedCastTime, level, ["Time", "Amount", "Value"]);
        if (fixedCastTime !== undefined) {
            parsed.fixedCastTime =
                fixedCastTime;
        }
        const element = getLevelString(raw.Element, level);
        if (element !== undefined) {
            parsed.element = element;
        }
        // Do not create empty level rows unnecessarily.
        if (Object.keys(parsed).length > 1) {
            levels.push(parsed);
        }
    }
    return levels;
}
function getLevelString(value, level) {
    if (value === undefined || value === null) {
        return undefined;
    }
    const scalar = asString(value);
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
        const record = entry;
        if (asInteger(record.Level) !== level) {
            continue;
        }
        for (const key of [
            "Element",
            "Value",
        ]) {
            const result = asString(record[key]);
            if (result !== undefined) {
                return result;
            }
        }
    }
    return undefined;
}
function parseItemCosts(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    const result = [];
    for (const rawItem of value) {
        if (!rawItem ||
            typeof rawItem !== "object") {
            continue;
        }
        const item = rawItem;
        const name = asString(item.Item);
        if (!name) {
            continue;
        }
        const amount = asInteger(item.Amount, 1) ?? 1;
        const level = asInteger(item.Level);
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
function parseRequirements(raw) {
    if (!raw.Requires ||
        typeof raw.Requires !== "object") {
        return [];
    }
    const requires = raw.Requires;
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
    const hasPerLevelValues = levelFields.some(hasLevelEntries);
    const maxLevel = asInteger(raw.MaxLevel, 1) ?? 1;
    const itemCosts = parseItemCosts(requires.ItemCost);
    const result = [];
    if (hasPerLevelValues) {
        for (let level = 1; level <= maxLevel; level++) {
            result.push(createRequirement(requires, level, itemCosts));
        }
        return result;
    }
    result.push(createRequirement(requires, null, itemCosts));
    return result;
}
function createRequirement(requires, level, itemCosts) {
    const getValue = (field) => {
        const value = requires[field];
        if (level === null) {
            return (asInteger(value, 0) ?? 0);
        }
        return getRequirementLevelValue(value, level);
    };
    return {
        level,
        hpCost: getValue("HpCost"),
        spCost: getValue("SpCost"),
        apCost: getValue("ApCost"),
        hpRateCost: getValue("HpRateCost"),
        spRateCost: getValue("SpRateCost"),
        apRateCost: getValue("ApRateCost"),
        maxHpTrigger: getValue("MaxHpTrigger"),
        zenyCost: getValue("ZenyCost"),
        weapon: serializeValue(requires.Weapon),
        ammo: asString(requires.Ammo),
        ammoAmount: getValue("AmmoAmount"),
        state: asString(requires.State),
        status: asString(requires.Status),
        spiritSphereCost: getValue("SpiritSphereCost"),
        equipment: asString(requires.Equipment),
        itemCosts,
    };
}
function parseUnit(raw) {
    if (!raw ||
        typeof raw !== "object") {
        return undefined;
    }
    const unit = raw;
    const unitId = asString(unit.Id);
    if (!unitId) {
        return undefined;
    }
    const levels = parseUnitLevels(unit.Layout, unit.Range);
    return {
        unitId,
        alternateId: asString(unit.AlternateId),
        layout: asInteger(unit.Layout, 0) ?? 0,
        range: asInteger(unit.Range, 0) ?? 0,
        interval: asInteger(unit.Interval, 0) ?? 0,
        target: asString(unit.Target),
        flags: serializeValue(unit.Flag),
        status: asString(unit.Status),
        levels,
    };
}
function parseUnitLevels(layout, range) {
    const levels = [];
    const hasLevels = hasLevelEntries(layout) ||
        hasLevelEntries(range);
    if (!hasLevels) {
        return levels;
    }
    const maxLevel = Math.max(getMaxLevelFromEntries(layout), getMaxLevelFromEntries(range));
    for (let level = 1; level <= maxLevel; level++) {
        const parsed = {
            level,
        };
        const layoutValue = getLevelValue(layout, level, ["Size", "Area", "Value"]);
        if (layoutValue !== undefined) {
            parsed.layout =
                layoutValue;
        }
        const rangeValue = getLevelValue(range, level, ["Size", "Range", "Value"]);
        if (rangeValue !== undefined) {
            parsed.range =
                rangeValue;
        }
        if (Object.keys(parsed).length > 1) {
            levels.push(parsed);
        }
    }
    return levels;
}
function getMaxLevelFromEntries(value) {
    if (!Array.isArray(value)) {
        return 0;
    }
    let max = 0;
    for (const entry of value) {
        if (!entry ||
            typeof entry !== "object") {
            continue;
        }
        const level = asInteger(entry
            .Level);
        if (level !== undefined &&
            level > max) {
            max = level;
        }
    }
    return max;
}
function parseUnits(raw) {
    if (!raw.Unit) {
        return [];
    }
    if (Array.isArray(raw.Unit)) {
        return raw.Unit
            .map(parseUnit)
            .filter((unit) => unit !== undefined);
    }
    const unit = parseUnit(raw.Unit);
    return unit ? [unit] : [];
}
function parseSkill(raw) {
    if (!raw ||
        typeof raw !== "object") {
        return undefined;
    }
    const entry = raw;
    const id = asInteger(entry.Id);
    const name = asString(entry.Name);
    if (id === undefined ||
        !name) {
        return undefined;
    }
    const maxLevel = asInteger(entry.MaxLevel, 1) ?? 1;
    return {
        id,
        aegisName: name,
        description: asString(entry.Description),
        maxLevel,
        type: asString(entry.Type),
        targetType: asString(entry.TargetType),
        hit: asString(entry.Hit),
        damageFlags: serializeValue(entry.DamageFlags),
        flags: serializeValue(entry.Flags),
        range: asInteger(entry.Range, 0) ?? 0,
        castCancel: asBoolean(entry.CastCancel, true),
        castDefenseReduction: asInteger(entry.CastDefenseReduction, 0) ?? 0,
        castTimeFlags: serializeValue(entry.CastTimeFlags),
        castDelayFlags: serializeValue(entry.CastDelayFlags),
        copyFlags: serializeValue(entry.CopyFlags),
        removeRequirement: serializeValue(entry.RemoveRequirement),
        noNearNpc: entry.NoNearNPC !== undefined,
        additionalRange: asInteger(entry.AdditionalRange),
        noNearNpcType: entry.NoNearNPC &&
            typeof entry.NoNearNPC === "object"
            ? asString(entry.NoNearNPC.Type)
            : undefined,
        levels: parseSkillLevels(entry),
        requirements: parseRequirements(entry),
        units: parseUnits(entry),
        source: "rathena",
    };
}
/**
 * Parse the complete rAthena skill_db.yml.
 */
export function parseSkillDbDefinitions() {
    console.log("[rAthena] Reading skill_db.yml...");
    const resolved = resolveYaml("skill_db.yml");
    console.log(`[rAthena] skill_db.yml source: ${resolved.source}`);
    const body = Array.isArray(resolved.data?.Body)
        ? resolved.data.Body
        : [];
    console.log(`[rAthena] skill_db.yml entries: ${body.length}`);
    const skills = [];
    for (const rawSkill of body) {
        const skill = parseSkill(rawSkill);
        if (!skill) {
            console.warn("[rAthena] Invalid skill_db entry.");
            continue;
        }
        skills.push(skill);
    }
    return skills;
}
/**
 * Parse and validate the complete skill database.
 */
export function parseSkillDb() {
    const parsed = parseSkillDbDefinitions();
    const unique = new Map();
    let duplicates = 0;
    for (const skill of parsed) {
        if (unique.has(skill.id)) {
            duplicates++;
            console.warn(`[rAthena] Duplicate skill ID: ${skill.id} (${skill.aegisName})`);
            continue;
        }
        unique.set(skill.id, skill);
    }
    const skills = Array.from(unique.values());
    console.log(`[rAthena] skills parsed: ${skills.length}`);
    console.log(`[rAthena] skill duplicates: ${duplicates}`);
    return {
        skills,
        duplicates,
    };
}
