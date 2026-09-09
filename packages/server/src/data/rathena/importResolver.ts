import { existsSync } from "fs";
import { join } from "path";
import {
  HELEONAIRE_IMPORT,
  RATHENA_DB_IMPORT,
  RATHENA_DB_RE,
} from "./paths";
import { loadYamlFile } from "./yamlLoader";

export interface ResolvedYaml<T = any> {
  data: T;
  source: "rathena" | "rathena-import" | "heleonaire-import";
  path: string;
}

export function resolveYaml<T = any>(
  fileName: string
): ResolvedYaml<T> {
  const heleonairePath = join(HELEONAIRE_IMPORT, fileName);

  if (existsSync(heleonairePath)) {
    return {
      data: loadYamlFile<T>(heleonairePath),
      source: "heleonaire-import",
      path: heleonairePath,
    };
  }

  const rathenaImportPath = join(RATHENA_DB_IMPORT, fileName);

  if (existsSync(rathenaImportPath)) {
    return {
      data: loadYamlFile<T>(rathenaImportPath),
      source: "rathena-import",
      path: rathenaImportPath,
    };
  }

  const rathenaPath = join(RATHENA_DB_RE, fileName);

  if (existsSync(rathenaPath)) {
    return {
      data: loadYamlFile<T>(rathenaPath),
      source: "rathena",
      path: rathenaPath,
    };
  }

  throw new Error(
    `Unable to resolve rAthena YAML: ${fileName}`
  );
}