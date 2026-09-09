import { parseMobs } from "./parsers/mobParser";
function main() {
    console.log("");
    console.log("=================================");
    console.log("        MOB PARSER TEST");
    console.log("=================================");
    const result = parseMobs();
    console.log("");
    console.log(`Mobs:       ${result.mobs.size}`);
    console.log(`Duplicates: ${result.duplicates}`);
    console.log("");
    console.log("First 5 mobs:");
    const firstFive = Array.from(result.mobs.values()).slice(0, 5);
    console.dir(firstFive, {
        depth: null,
    });
    console.log("");
    console.log("Mob 1002:");
    const mob1002 = result.mobs.get(1002);
    console.dir(mob1002, {
        depth: null,
    });
    console.log("");
    console.log("=================================");
}
main();
