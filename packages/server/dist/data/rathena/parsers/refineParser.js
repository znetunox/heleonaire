import { resolveYaml } from "../importResolver";
function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number)
        ? number
        : fallback;
}
function toString(value, fallback = "") {
    if (value === undefined || value === null) {
        return fallback;
    }
    return String(value);
}
function toBoolean(value, fallback = false) {
    if (value === undefined || value === null) {
        return fallback;
    }
    return Boolean(value);
}
function parseRawChance(raw) {
    return {
        type: toString(raw.Type),
        rate: toNumber(raw.Rate),
        price: toNumber(raw.Price),
        material: toString(raw.Material),
        breakingRate: toNumber(raw.BreakingRate),
        downgradeAmount: toNumber(raw.DowngradeAmount),
    };
}
export function parseRefine() {
    console.log("[rAthena] Reading refine.yml...");
    const resolved = resolveYaml("refine.yml");
    const groups = resolved.data.Body ?? [];
    const rules = [];
    const keys = new Set();
    let duplicates = 0;
    for (const group of groups) {
        const groupName = toString(group.Group);
        if (!groupName) {
            console.warn("[rAthena] Ignoring refine group without Group");
            continue;
        }
        const levels = group.Levels ?? [];
        for (const itemLevel of levels) {
            const level = toNumber(itemLevel.Level);
            if (!level) {
                console.warn(`[rAthena] Ignoring refine group "${groupName}" without valid item Level`);
                continue;
            }
            const refineLevels = itemLevel.RefineLevels ?? [];
            for (const refineLevel of refineLevels) {
                const levelNumber = toNumber(refineLevel.Level);
                if (!levelNumber) {
                    console.warn(`[rAthena] Ignoring refine rule "${groupName}" itemLevel=${level} without valid refine Level`);
                    continue;
                }
                const key = `${groupName}:${level}:${levelNumber}`;
                if (keys.has(key)) {
                    duplicates++;
                    console.warn(`[rAthena] Duplicate refine rule: ${key}`);
                }
                keys.add(key);
                const chances = (refineLevel.Chances ?? [])
                    .map(parseRawChance);
                rules.push({
                    group: groupName,
                    itemLevel: level,
                    refineLevel: levelNumber,
                    bonus: toNumber(refineLevel.Bonus),
                    randomBonus: toNumber(refineLevel.RandomBonus),
                    blacksmithBlessingAmount: toNumber(refineLevel.BlacksmithBlessingAmount),
                    broadcastSuccess: toBoolean(refineLevel.BroadcastSuccess),
                    broadcastFailure: toBoolean(refineLevel.BroadcastFailure),
                    chances,
                });
            }
        }
    }
    console.log(`[rAthena] Refine rules parsed: ${rules.length}`);
    console.log(`[rAthena] Refine duplicates: ${duplicates}`);
    return {
        rules,
        duplicates,
    };
}
