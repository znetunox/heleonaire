import fs from "fs";
import yaml from "yaml";
function parseModifier(value, weaponType, size) {
    if (value === undefined || value === null) {
        return 100;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
        throw new Error(`Invalid Size Fix value for ${weaponType} ${size}: ${String(value)}`);
    }
    if (parsed < 0 || parsed > 100) {
        throw new Error(`Invalid Size Fix value for ${weaponType} ${size}: ${parsed}. Expected 0..100.`);
    }
    return parsed;
}
export function parseSizeFix(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Size Fix database not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, "utf8");
    const data = yaml.parse(content);
    if (!data || !Array.isArray(data.Body)) {
        throw new Error(`Invalid Size Fix database: Body must be an array.`);
    }
    const rules = [];
    const seen = new Set();
    let duplicates = 0;
    for (const entry of data.Body) {
        if (entry.Weapon === undefined || entry.Weapon === null) {
            throw new Error(`Invalid Size Fix entry: Weapon is required.`);
        }
        const weaponType = String(entry.Weapon).trim();
        if (!weaponType) {
            throw new Error(`Invalid Size Fix entry: Weapon cannot be empty.`);
        }
        if (seen.has(weaponType)) {
            duplicates++;
            continue;
        }
        seen.add(weaponType);
        rules.push({
            weaponType,
            small: parseModifier(entry.Small, weaponType, "Small"),
            medium: parseModifier(entry.Medium, weaponType, "Medium"),
            large: parseModifier(entry.Large, weaponType, "Large"),
        });
    }
    return {
        rules,
        duplicates,
    };
}
