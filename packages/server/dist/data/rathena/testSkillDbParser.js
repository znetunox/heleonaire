import { parseSkillDb, } from "./parsers/skillDbParser";
function main() {
    console.log("=== rAthena Skill DB Audit ===");
    const result = parseSkillDb();
    console.log("\n============================================================");
    console.log("SUMMARY");
    console.log(`Skills:              ${result.skills.length}`);
    console.log(`Duplicates:           ${result.duplicates}`);
    console.log("\n============================================================");
    const selectedNames = [
        "NV_BASIC",
        "SM_SWORD",
        "SM_BASH",
        "SM_PROVOKE",
        "SM_MAGNUM",
        "MG_COLDBOLT",
        "MG_SAFETYWALL",
    ];
    for (const name of selectedNames) {
        const skill = result.skills.find(skill => skill.aegisName === name);
        if (!skill) {
            console.log(`\n${name}: NOT FOUND`);
            continue;
        }
        console.log(`\n${skill.aegisName} (id=${skill.id})`);
        console.log(`  description: ${skill.description}`);
        console.log(`  maxLevel: ${skill.maxLevel}`);
        console.log(`  type: ${skill.type ?? "-"}`);
        console.log(`  targetType: ${skill.targetType ?? "-"}`);
        console.log(`  range: ${skill.range}`);
        console.log(`  hit: ${skill.hit ?? "-"}`);
        console.log(`  levels: ${skill.levels.length}`);
        console.log(`  requirements: ${skill.requirements.length}`);
        console.log(`  units: ${skill.units.length}`);
        if (skill.levels.length > 0) {
            console.log("  level data:");
            for (const level of skill.levels) {
                console.log(`    Lv${level.level}:`, JSON.stringify(level));
            }
        }
        if (skill.requirements.length > 0) {
            console.log("  requirements:");
            for (const requirement of skill.requirements) {
                console.log(`    ${requirement.level === null
                    ? "all levels"
                    : `Lv${requirement.level}`}:`, JSON.stringify(requirement));
            }
        }
        if (skill.units.length > 0) {
            console.log("  units:");
            for (const unit of skill.units) {
                console.log(`    ${unit.unitId}:`, JSON.stringify(unit));
            }
        }
    }
    console.log("\n============================================================");
    if (result.duplicates > 0) {
        console.log("Skill DB audit: FAILED");
        process.exitCode = 1;
        return;
    }
    console.log("Skill DB audit: OK");
}
main();
