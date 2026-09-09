import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";
import { parseItems } from "../parsers/itemParser";
const prisma = new PrismaClient();
function calculateSourceHash(item) {
    const normalized = JSON.stringify(item);
    return createHash("sha256")
        .update(normalized)
        .digest("hex");
}
function optionalNumber(value) {
    return value ?? null;
}
function optionalString(value) {
    return value ?? null;
}
async function importItem(item) {
    const sourceHash = calculateSourceHash(item);
    await prisma.item.upsert({
        where: {
            id: item.id,
        },
        create: {
            id: item.id,
            aegisName: item.aegisName,
            name: item.name,
            type: item.type,
            subType: optionalString(item.subType),
            buy: item.buy,
            sell: item.sell,
            weight: item.weight,
            attack: optionalNumber(item.attack),
            magicAttack: optionalNumber(item.magicAttack),
            defense: optionalNumber(item.defense),
            range: optionalNumber(item.range),
            slots: optionalNumber(item.slots),
            weaponLevel: optionalNumber(item.weaponLevel),
            armorLevel: optionalNumber(item.armorLevel),
            equipLevelMin: optionalNumber(item.equipLevelMin),
            equipLevelMax: optionalNumber(item.equipLevelMax),
            refineable: item.refineable,
            gradable: item.gradable,
            jobs: optionalString(item.jobs),
            job: optionalString(item.job),
            classes: optionalString(item.classes),
            gender: optionalString(item.gender),
            locations: optionalString(item.locations),
            view: optionalNumber(item.view),
            aliasName: optionalString(item.aliasName),
            script: optionalString(item.script),
            equipScript: optionalString(item.equipScript),
            unequipScript: optionalString(item.unequipScript),
            flags: optionalString(item.flags),
            noUse: optionalString(item.noUse),
            trade: optionalString(item.trade),
            stack: optionalString(item.stack),
            delay: optionalString(item.delay),
            source: "rathena",
            sourceHash,
        },
        update: {
            aegisName: item.aegisName,
            name: item.name,
            type: item.type,
            subType: optionalString(item.subType),
            buy: item.buy,
            sell: item.sell,
            weight: item.weight,
            attack: optionalNumber(item.attack),
            magicAttack: optionalNumber(item.magicAttack),
            defense: optionalNumber(item.defense),
            range: optionalNumber(item.range),
            slots: optionalNumber(item.slots),
            weaponLevel: optionalNumber(item.weaponLevel),
            armorLevel: optionalNumber(item.armorLevel),
            equipLevelMin: optionalNumber(item.equipLevelMin),
            equipLevelMax: optionalNumber(item.equipLevelMax),
            refineable: item.refineable,
            gradable: item.gradable,
            jobs: optionalString(item.jobs),
            job: optionalString(item.job),
            classes: optionalString(item.classes),
            gender: optionalString(item.gender),
            locations: optionalString(item.locations),
            view: optionalNumber(item.view),
            aliasName: optionalString(item.aliasName),
            script: optionalString(item.script),
            equipScript: optionalString(item.equipScript),
            unequipScript: optionalString(item.unequipScript),
            flags: optionalString(item.flags),
            noUse: optionalString(item.noUse),
            trade: optionalString(item.trade),
            stack: optionalString(item.stack),
            delay: optionalString(item.delay),
            source: "rathena",
            sourceHash,
        },
    });
}
async function main() {
    console.log("");
    console.log("=========================================");
    console.log("       rAthena ITEM IMPORTER");
    console.log("=========================================");
    console.log("");
    const result = parseItems();
    console.log(`Items parsed: ${result.items.size}`);
    console.log(`Duplicates:   ${result.duplicates}`);
    console.log("");
    let imported = 0;
    let failed = 0;
    const start = Date.now();
    for (const item of result.items.values()) {
        try {
            await importItem(item);
            imported++;
            if (imported % 500 === 0) {
                console.log(`Progress: ${imported}/${result.items.size}`);
            }
        }
        catch (error) {
            failed++;
            console.error(`[ERROR] Item ${item.id} (${item.aegisName})`);
            console.error(error);
        }
    }
    const elapsed = Date.now() - start;
    console.log("");
    console.log("=========================================");
    console.log("          IMPORT FINISHED");
    console.log("=========================================");
    console.log(`Parsed:     ${result.items.size}`);
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
