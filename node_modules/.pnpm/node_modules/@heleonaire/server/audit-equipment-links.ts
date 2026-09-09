import prisma from "./src/db/prisma";

async function main() {
    const equipment = await prisma.characterEquipment.findMany({
        select: {
            id: true,
            characterId: true,
            itemId: true,
            slot: true,
            inventoryId: true,
            refineLevel: true,
            item: {
                select: {
                    name: true,
                    type: true,
                },
            },
        },
        orderBy: {
            characterId: "asc",
        },
    });

    console.log("\n===== EQUIPMENT LINKS =====");
    console.log(`Total: ${equipment.length}`);

    console.table(
        equipment.map((row) => ({
            equipmentId: row.id,
            characterId: row.characterId,
            itemId: row.itemId,
            itemName: row.item.name,
            type: row.item.type,
            slot: row.slot,
            inventoryId: row.inventoryId,
            refineLevel: row.refineLevel,
        })),
    );

    const legacy = equipment.filter(
        row => row.inventoryId === null,
    );

    console.log("\n===== EQUIPMENT SEM INVENTORY ID =====");
    console.log(`Total: ${legacy.length}`);

    if (legacy.length > 0) {
        console.table(
            legacy.map((row) => ({
                equipmentId: row.id,
                characterId: row.characterId,
                itemId: row.itemId,
                itemName: row.item.name,
                slot: row.slot,
            })),
        );
    }
}

main()
    .catch(error => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });