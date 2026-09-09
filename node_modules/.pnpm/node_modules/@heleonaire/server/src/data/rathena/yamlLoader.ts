import { existsSync, readFileSync } from "fs";
import { parse as parseYaml } from "yaml";

export function loadYamlFile<T = any>(filePath: string): T {
  if (!existsSync(filePath)) {
    throw new Error(`YAML file not found: ${filePath}`);
  }

  const content = readFileSync(filePath, "utf-8");

  return parseYaml(content, {
    uniqueKeys: false,
  }) as T;
}

export function tryLoadYamlFile<T = any>(
  filePath: string
): T | undefined {
  if (!existsSync(filePath)) {
    return undefined;
  }

  return loadYamlFile<T>(filePath);
}