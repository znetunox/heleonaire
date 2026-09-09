import { existsSync } from "fs";
import { join } from "path";
import { HELEONAIRE_IMPORT, RATHENA_DB_IMPORT, RATHENA_DB_RE, } from "./paths";
import { loadYamlFile } from "./yamlLoader";
export function resolveYaml(fileName) {
    const heleonairePath = join(HELEONAIRE_IMPORT, fileName);
    if (existsSync(heleonairePath)) {
        return {
            data: loadYamlFile(heleonairePath),
            source: "heleonaire-import",
            path: heleonairePath,
        };
    }
    const rathenaImportPath = join(RATHENA_DB_IMPORT, fileName);
    if (existsSync(rathenaImportPath)) {
        return {
            data: loadYamlFile(rathenaImportPath),
            source: "rathena-import",
            path: rathenaImportPath,
        };
    }
    const rathenaPath = join(RATHENA_DB_RE, fileName);
    if (existsSync(rathenaPath)) {
        return {
            data: loadYamlFile(rathenaPath),
            source: "rathena",
            path: rathenaPath,
        };
    }
    throw new Error(`Unable to resolve rAthena YAML: ${fileName}`);
}
