import { resolve } from "path";

export const RATHENA_ROOT = resolve(
  process.cwd(),
  "../../rathena-master"
);

export const RATHENA_DB_RE = resolve(
  RATHENA_ROOT,
  "db/re"
);

export const RATHENA_DB_IMPORT = resolve(
  RATHENA_ROOT,
  "db/import"
);

export const RATHENA_SRC_COMMON = resolve(
  RATHENA_ROOT,
  "src/common"
);

export const HELEONAIRE_IMPORT = resolve(
  process.cwd(),
  "../../data/import"
);