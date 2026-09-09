import prisma from "./src/db/prisma";

async function main() {
    const rows = await prisma.inventory.findMany({
        where: {
            instanceId: null,
            item: {
                type: {
                    in: [
                        "Weapon",
                        "Armor",
                        "Shadowgear",
                        "Card",
                    ],
                },
            },
        },
        select: {
            id: true,
            characterId: true,
            itemId: true,
            quantity: true,
            refineLevel: true,
            item: {
                select: {
                    name: true,
                    type: true,
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    console.log("\n===== LEGACY INSTANCE ITEMS =====");
    console.log(`Total de entradas: ${rows.length}`);

    const byType = new Map<string, number>();

    for (const row of rows) {
        byType.set(
            row.item.type,
            (byType.get(row.item.type) ?? 0) + 1,
        );
    }

    console.log("\nPor tipo:");
    console.table(
        [...byType.entries()].map(
            ([type, count]) => ({
                type,
                entries: count,
            }),
        ),
    );

    console.log("\nQuantidade total física:");

    const totalQuantity = rows.reduce(
        (sum, row) => sum + row.quantity,
        0,
    );

    console.log(totalQuantity);

    console.log("\nEntradas com quantity > 1:");

    const stacked = rows.filter(
        row => row.quantity > 1,
    );

    console.log(
        `Total: ${stacked.length}`,
    );

    console.table(
        stacked.slice(0, 50).map(row => ({
            inventoryId: row.id,
            characterId: row.characterId,
            itemId: row.itemId,
            itemName: row.item.name,
            type: row.item.type,
            quantity: row.quantity,
            refineLevel: row.refineLevel,
        })),
    );
}

main()
    .catch(error => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });