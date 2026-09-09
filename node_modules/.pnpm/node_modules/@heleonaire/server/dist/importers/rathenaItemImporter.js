import { rathenaDb } from "../parsers/rathenaParser";
import { prisma } from "../db/prisma";
export async function importRathenaItems() {
    for (const item of rathenaDb.items.values()) {
        await prisma.item.upsert({
            where: { id: item.id },
            create: {
                id: item.id,
                aegisName: item.aegisName,
                name: item.name,
                type: item.type,
                subType: item.subType,
                buy: item.buy,
                sell: item.sell,
                weight: item.weight,
                attack: item.attack,
                magicAttack: item.magicAttack,
                defense: item.defense,
                range: item.range,
                slots: item.slots,
                weaponLevel: item.weaponLevel,
                armorLevel: item.armorLevel,
                equipLevelMin: item.equipLevelMin,
                refineable: item.refineable,
            },
            update: {
                id: item.id,
                aegisName: item.aegisName,
                name: item.name,
                type: item.type,
                subType: item.subType,
                buy: item.buy,
                sell: item.sell,
                weight: item.weight,
                attack: item.attack,
                magicAttack: item.magicAttack,
                defense: item.defense,
                range: item.range,
                slots: item.slots,
                weaponLevel: item.weaponLevel,
                armorLevel: item.armorLevel,
                equipLevelMin: item.equipLevelMin,
                refineable: item.refineable,
            },
        });
    }
    return rathenaDb.items.size;
}
