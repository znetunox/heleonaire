import { existsSync, readFileSync } from "fs";
import { parse as parseYaml } from "yaml";
export function loadYamlFile(filePath) {
    if (!existsSync(filePath)) {
        throw new Error(`YAML file not found: ${filePath}`);
    }
    const content = readFileSync(filePath, "utf-8");
    return parseYaml(content, {
        uniqueKeys: false,
    });
}
export function tryLoadYamlFile(filePath) {
    if (!existsSync(filePath)) {
        return undefined;
    }
    return loadYamlFile(filePath);
}
