import { resolveYaml } from "./importResolver";
const mobDb = resolveYaml("mob_db.yml");
console.log("[rAthena] mob_db source:", mobDb.source);
console.log("[rAthena] mob_db path:", mobDb.path);
console.log("[rAthena] mob entries:", Array.isArray(mobDb.data?.Body)
    ? mobDb.data.Body.length
    : 0);
