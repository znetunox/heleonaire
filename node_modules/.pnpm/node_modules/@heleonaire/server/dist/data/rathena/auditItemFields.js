import { resolveYaml } from "./importResolver";
const files = [
    "item_db_equip.yml",
    "item_db_etc.yml",
    "item_db_usable.yml",
];
const fields = new Map();
for (const file of files) {
    console.log("");
    console.log(`=========================================`);
    console.log(` AUDITANDO ${file}`);
    console.log(`=========================================`);
    const resolved = resolveYaml(file);
    const entries = resolved.data?.Body ?? [];
    console.log(`Entries: ${entries.length}`);
    for (const item of entries) {
        for (const [key, value] of Object.entries(item)) {
            let info = fields.get(key);
            if (!info) {
                info = {
                    count: 0,
                    types: new Set(),
                    examples: [],
                };
                fields.set(key, info);
            }
            info.count++;
            info.types.add(value === null
                ? "null"
                : Array.isArray(value)
                    ? "array"
                    : typeof value);
            if (info.examples.length < 3) {
                info.examples.push(value);
            }
        }
    }
}
console.log("");
console.log("=========================================");
console.log("        ITEM FIELD AUDIT");
console.log("=========================================");
const sorted = Array.from(fields.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));
for (const [key, info] of sorted) {
    console.log("");
    console.log(`${key}`);
    console.log(`  Present: ${info.count}`);
    console.log(`  Types:   ${Array.from(info.types).join(", ")}`);
    for (let i = 0; i < info.examples.length; i++) {
        console.log(`  Example ${i + 1}:`);
        console.dir(info.examples[i], {
            depth: 5,
        });
    }
}
console.log("");
console.log("=========================================");
console.log(`Total unique fields: ${fields.size}`);
console.log("=========================================");
