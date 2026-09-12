import { loadYamlFile } from "../yamlLoader";
export const RATHENA_ELEMENTS = [
    "Neutral",
    "Water",
    "Earth",
    "Fire",
    "Wind",
    "Poison",
    "Holy",
    "Dark",
    "Ghost",
    "Undead",
];
function assertElement(value) {
    if (!RATHENA_ELEMENTS.includes(value)) {
        throw new Error(`Unknown rAthena element: ${value}`);
    }
}
export function parseAttributeTable(filePath) {
    const raw = loadYamlFile(filePath);
    if (raw.Header?.Type !== "ATTRIBUTE_DB") {
        throw new Error(`Invalid ATTRIBUTE_DB type: ${raw.Header?.Type}`);
    }
    if (raw.Header?.Version !== 1) {
        throw new Error(`Unsupported ATTRIBUTE_DB version: ${raw.Header?.Version}`);
    }
    if (!Array.isArray(raw.Body)) {
        throw new Error("ATTRIBUTE_DB Body must be an array");
    }
    const table = new Map();
    for (const levelEntry of raw.Body) {
        if (typeof levelEntry.Level !== "number" ||
            !Number.isInteger(levelEntry.Level)) {
            throw new Error("ATTRIBUTE_DB level must be an integer");
        }
        const level = levelEntry.Level;
        if (level < 1 || level > 4) {
            throw new Error(`Unsupported attribute level: ${level}`);
        }
        if (table.has(level)) {
            throw new Error(`Duplicate ATTRIBUTE_DB level: ${level}`);
        }
        const attackMap = new Map();
        for (const attackElement of RATHENA_ELEMENTS) {
            const rawTargetMap = levelEntry[attackElement];
            if (rawTargetMap === null ||
                typeof rawTargetMap !== "object" ||
                Array.isArray(rawTargetMap)) {
                throw new Error(`Missing attack element ${attackElement} at level ${level}`);
            }
            const targetMap = new Map();
            for (const targetElement of RATHENA_ELEMENTS) {
                const value = rawTargetMap[targetElement];
                if (typeof value !== "number" ||
                    !Number.isFinite(value)) {
                    throw new Error(`Invalid ratio: L${level} ${attackElement} -> ${targetElement}`);
                }
                if (value < -100 || value > 200) {
                    throw new Error(`Invalid ratio ${value}: L${level} ${attackElement} -> ${targetElement}`);
                }
                targetMap.set(targetElement, value);
            }
            attackMap.set(attackElement, targetMap);
        }
        table.set(level, attackMap);
    }
    for (let level = 1; level <= 4; level++) {
        if (!table.has(level)) {
            throw new Error(`Missing ATTRIBUTE_DB level: ${level}`);
        }
    }
    return {
        version: 1,
        levels: [1, 2, 3, 4],
        getRatio(level, attackElement, targetElement) {
            assertElement(attackElement);
            assertElement(targetElement);
            const attackMap = table.get(level);
            if (!attackMap) {
                throw new Error(`Invalid attribute level: ${level}`);
            }
            const targetMap = attackMap.get(attackElement);
            if (!targetMap) {
                throw new Error(`Missing attack element: ${attackElement}`);
            }
            const ratio = targetMap.get(targetElement);
            if (ratio === undefined) {
                throw new Error(`Missing target element: ${targetElement}`);
            }
            return ratio;
        },
    };
}
export function applyRenewalElementRatio(damage, ratio) {
    return (damage -
        Math.trunc(damage * (100 - ratio) / 100));
}
