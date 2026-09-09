import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";
import { parseMobs } from "../parsers/mobParser";
const prisma = new PrismaClient();
function calculateSourceHash(mob) {
    return createHash("sha256")
        .update(JSON.stringify(mob))
        .digest("hex");
}
function optionalNumber(value) {
    return value ?? null;
}
async function importMob(mob) {
    const sourceHash = calculateSourceHash(mob);
    await prisma.mob.upsert({
        where: {
            id: mob.id,
        },
        create: {
            id: mob.id,
            aegisName: mob.aegisName,
            name: mob.name,
            level: mob.level,
            hp: mob.hp,
            sp: mob.sp,
            baseExp: mob.baseExp,
            jobExp: mob.jobExp,
            attack: mob.attack,
            attack2: mob.attack2,
            defense: mob.defense,
            magicDefense: mob.magicDefense,
            str: mob.str,
            agi: mob.agi,
            vit: mob.vit,
            int: mob.int,
            dex: mob.dex,
            luk: mob.luk,
            attackRange: mob.attackRange,
            skillRange: mob.skillRange,
            chaseRange: mob.chaseRange,
            size: mob.size,
            race: mob.race,
            element: mob.element,
            elementLevel: mob.elementLevel,
            walkSpeed: mob.walkSpeed,
            attackDelay: mob.attackDelay,
            attackMotion: mob.attackMotion,
            damageMotion: mob.damageMotion,
            ai: mob.ai,
            source: "rathena",
            sourceHash,
        },
        update: {
            aegisName: mob.aegisName,
            name: mob.name,
            level: mob.level,
            hp: mob.hp,
            sp: mob.sp,
            baseExp: mob.baseExp,
            jobExp: mob.jobExp,
            attack: mob.attack,
            attack2: mob.attack2,
            defense: mob.defense,
            magicDefense: mob.magicDefense,
            str: mob.str,
            agi: mob.agi,
            vit: mob.vit,
            int: mob.int,
            dex: mob.dex,
            luk: mob.luk,
            attackRange: mob.attackRange,
            skillRange: mob.skillRange,
            chaseRange: mob.chaseRange,
            size: mob.size,
            race: mob.race,
            element: mob.element,
            elementLevel: mob.elementLevel,
            walkSpeed: mob.walkSpeed,
            attackDelay: mob.attackDelay,
            attackMotion: mob.attackMotion,
            damageMotion: mob.damageMotion,
            ai: mob.ai,
            source: "rathena",
            sourceHash,
        },
    });
}
async function main() {
    console.log("");
    console.log("=========================================");
    console.log("       rAthena MOB IMPORTER");
    console.log("=========================================");
    console.log("");
    const result = parseMobs();
    console.log(`Mobs parsed: ${result.mobs.size}`);
    console.log(`Duplicates:  ${result.duplicates}`);
    console.log("");
    let imported = 0;
    let failed = 0;
    const start = Date.now();
    for (const mob of result.mobs.values()) {
        try {
            await importMob(mob);
            imported++;
            if (imported % 500 === 0) {
                console.log(`Progress: ${imported}/${result.mobs.size}`);
            }
        }
        catch (error) {
            failed++;
            console.error(`[ERROR] Mob ${mob.id} (${mob.aegisName})`);
            console.error(error);
        }
    }
    const elapsed = Date.now() - start;
    console.log("");
    console.log("=========================================");
    console.log("          IMPORT FINISHED");
    console.log("=========================================");
    console.log(`Parsed:     ${result.mobs.size}`);
    console.log(`Imported:   ${imported}`);
    console.log(`Failed:     ${failed}`);
    console.log(`Time:       ${(elapsed / 1000).toFixed(2)}s`);
    console.log("=========================================");
    console.log("");
    await prisma.$disconnect();
    if (failed > 0) {
        process.exitCode = 1;
    }
}
main().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
});
